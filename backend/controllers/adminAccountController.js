const bcrypt = require("bcryptjs");

const pool = require("../config/database");


// =====================================================
// CONSTANTS
// =====================================================

const PASSWORD_SALT_ROUNDS = 12;

const VALID_ACCOUNT_TYPES = [
    "OFFICIAL",
    "SECURITY"
];


// =====================================================
// HELPER: CLEAN TEXT
// =====================================================

const cleanText = (value) => {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();

};


// =====================================================
// HELPER: VALIDATE TEMPORARY PASSWORD
// =====================================================

const validatePassword = (password) => {

    if (!password) {

        return "Temporary password is required.";

    }


    if (password.length < 8) {

        return "Password must contain at least 8 characters.";

    }


    if (!/[A-Z]/.test(password)) {

        return "Password must contain at least one uppercase letter.";

    }


    if (!/[a-z]/.test(password)) {

        return "Password must contain at least one lowercase letter.";

    }


    if (!/[0-9]/.test(password)) {

        return "Password must contain at least one number.";

    }


    if (
        !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
            password
        )
    ) {

        return "Password must contain at least one special character.";

    }


    return null;

};


// =====================================================
// HELPER: NORMALIZE ACCOUNT TYPE
// =====================================================

const getAccountType = (value) => {

    const accountType =
        cleanText(value).toUpperCase();


    if (
        !VALID_ACCOUNT_TYPES.includes(
            accountType
        )
    ) {
        return null;
    }


    return accountType;

};


// =====================================================
// HELPER: ADMIN AUDIT LOG
// =====================================================

const createAuditLog = async (
    client,
    req,
    actionType,
    targetType,
    targetId,
    description
) => {

    const adminAccountId =
        req.authUser?.adminAccountId;


    if (!adminAccountId) {

        throw new Error(
            "Administrator account information is missing."
        );

    }


    await client.query(
        `
            INSERT INTO admin_audit_logs
            (
                admin_account_id,
                action_type,
                target_type,
                target_id,
                description
            )
            VALUES ($1, $2, $3, $4, $5)
        `,
        [
            adminAccountId,
            actionType,
            targetType,
            targetId,
            description
        ]
    );

};


// =====================================================
// GET ALL OFFICIAL AND SECURITY ACCOUNTS
//
// GET /api/admin/access/accounts
// =====================================================

const getAccounts = async (req, res) => {

    try {

        const [
            officialResult,
            securityResult
        ] = await Promise.all([

            pool.query(
                `
                    SELECT
                        oa.id,
                        'OFFICIAL' AS account_type,
                        oa.employee_id,
                        e.employee_code,
                        e.employee_name,
                        e.department_id,
                        d.department_name,
                        e.unit,
                        oa.email AS login_id,
                        oa.email,
                        oa.is_active,
                        e.is_active AS employee_active,
                        oa.must_change_password,
                        oa.failed_login_attempts,
                        oa.locked_until,
                        oa.password_changed_at,
                        oa.created_at,
                        oa.updated_at

                    FROM official_accounts oa

                    INNER JOIN employees e
                        ON e.id = oa.employee_id

                    INNER JOIN departments d
                        ON d.id = e.department_id

                    ORDER BY
                        e.employee_name ASC
                `
            ),

            pool.query(
                `
                    SELECT
                        sa.id,
                        'SECURITY' AS account_type,
                        NULL::integer AS employee_id,
                        NULL::varchar AS employee_code,
                        sa.display_name AS employee_name,
                        NULL::integer AS department_id,
                        NULL::varchar AS department_name,
                        NULL::varchar AS unit,
                        sa.username AS login_id,
                        NULL::varchar AS email,
                        sa.is_active,
                        true AS employee_active,
                        sa.must_change_password,
                        sa.failed_login_attempts,
                        sa.locked_until,
                        sa.password_changed_at,
                        sa.created_at,
                        sa.updated_at

                    FROM security_accounts sa

                    ORDER BY
                        sa.display_name ASC,
                        sa.username ASC
                `
            )

        ]);


        res.json({

            success: true,

            summary: {

                official_accounts:
                    officialResult.rows.length,

                security_accounts:
                    securityResult.rows.length,

                total_accounts:
                    officialResult.rows.length +
                    securityResult.rows.length

            },

            official_accounts:
                officialResult.rows,

            security_accounts:
                securityResult.rows

        });

    }

    catch (error) {

        console.error(
            "Get admin accounts error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to load user accounts.",

            error:
                error.message

        });

    }

};


// =====================================================
// CREATE OFFICIAL ACCOUNT
//
// POST /api/admin/access/accounts/official
//
// Body:
// {
//     "employee_id": 55,
//     "temporary_password": "Welcome@123"
// }
// =====================================================

const createOfficialAccount = async (
    req,
    res
) => {

    const client =
        await pool.connect();


    try {

        const employeeId =
            Number.parseInt(
                req.body.employee_id,
                10
            );


        const temporaryPassword =
            cleanText(
                req.body.temporary_password
            );


        if (!Number.isInteger(employeeId)) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid employee ID is required."

            });

        }


        const passwordError =
            validatePassword(
                temporaryPassword
            );


        if (passwordError) {

            return res.status(400).json({

                success: false,

                message:
                    passwordError

            });

        }


        await client.query("BEGIN");


        const employeeResult =
            await client.query(
                `
                    SELECT
                        e.id,
                        e.employee_code,
                        e.employee_name,
                        e.email,
                        e.is_active,
                        e.department_id,
                        d.department_name,
                        e.unit
                    FROM employees e
                    INNER JOIN departments d
                        ON d.id = e.department_id
                    WHERE e.id = $1
                    FOR UPDATE
                `,
                [employeeId]
            );


        if (
            employeeResult.rows.length === 0
        ) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    "Employee not found."

            });

        }


        const employee =
            employeeResult.rows[0];


        if (!employee.is_active) {

            await client.query("ROLLBACK");


            return res.status(400).json({

                success: false,

                message:
                    "Cannot create an account for an inactive employee."

            });

        }


        if (!employee.email) {

            await client.query("ROLLBACK");


            return res.status(400).json({

                success: false,

                message:
                    "The employee does not have an email address."

            });

        }


        const existingAccountResult =
            await client.query(
                `
                    SELECT id
                    FROM official_accounts
                    WHERE employee_id = $1
                       OR LOWER(email) =
                          LOWER($2)
                    LIMIT 1
                `,
                [
                    employeeId,
                    employee.email
                ]
            );


        if (
            existingAccountResult.rows.length >
            0
        ) {

            await client.query("ROLLBACK");


            return res.status(409).json({

                success: false,

                message:
                    "An official account already exists for this employee or email."

            });

        }


        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                PASSWORD_SALT_ROUNDS
            );


        const accountResult =
            await client.query(
                `
                    INSERT INTO official_accounts
                    (
                        employee_id,
                        email,
                        password_hash,
                        is_active,
                        must_change_password,
                        password_changed_at,
                        failed_login_attempts,
                        locked_until,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        $1,
                        LOWER($2),
                        $3,
                        true,
                        true,
                        NULL,
                        0,
                        NULL,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                    RETURNING
                        id,
                        employee_id,
                        email,
                        is_active,
                        must_change_password,
                        failed_login_attempts,
                        locked_until,
                        created_at,
                        updated_at
                `,
                [
                    employeeId,
                    employee.email,
                    passwordHash
                ]
            );


        const account =
            accountResult.rows[0];


        await createAuditLog(
            client,
            req,
            "CREATE_OFFICIAL_ACCOUNT",
            "OFFICIAL_ACCOUNT",
            account.id,
            `Created official login for ${employee.employee_name} (${employee.email}).`
        );


        await client.query("COMMIT");


        res.status(201).json({

            success: true,

            message:
                "Official account created successfully.",

            account: {

                ...account,

                account_type:
                    "OFFICIAL",

                employee_code:
                    employee.employee_code,

                employee_name:
                    employee.employee_name,

                department_name:
                    employee.department_name,

                unit:
                    employee.unit

            },

            temporary_password:
                temporaryPassword,

            password_notice:
                "This temporary password is displayed only in this response. The employee must change it after login."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Create official account error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "An official account already exists for this employee or email."

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Unable to create official account.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// CREATE SECURITY ACCOUNT
//
// POST /api/admin/access/accounts/security
//
// Body:
// {
//     "username": "security2",
//     "display_name": "Security Guard 2",
//     "temporary_password": "Security@456"
// }
// =====================================================

const createSecurityAccount = async (
    req,
    res
) => {

    const client =
        await pool.connect();


    try {

        const username =
            cleanText(
                req.body.username
            ).toLowerCase();


        const displayName =
            cleanText(
                req.body.display_name
            );


        const temporaryPassword =
            cleanText(
                req.body.temporary_password
            );


        if (!username) {

            return res.status(400).json({

                success: false,

                message:
                    "Security username is required."

            });

        }


        if (
            !/^[a-z0-9._-]+$/.test(
                username
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Username can contain only letters, numbers, dots, underscores and hyphens."

            });

        }


        if (!displayName) {

            return res.status(400).json({

                success: false,

                message:
                    "Security display name is required."

            });

        }


        const passwordError =
            validatePassword(
                temporaryPassword
            );


        if (passwordError) {

            return res.status(400).json({

                success: false,

                message:
                    passwordError

            });

        }


        await client.query("BEGIN");


        const existingResult =
            await client.query(
                `
                    SELECT id
                    FROM security_accounts
                    WHERE LOWER(username) =
                        LOWER($1)
                    LIMIT 1
                `,
                [username]
            );


        if (existingResult.rows.length > 0) {

            await client.query("ROLLBACK");


            return res.status(409).json({

                success: false,

                message:
                    "This security username already exists."

            });

        }


        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                PASSWORD_SALT_ROUNDS
            );


        const accountResult =
            await client.query(
                `
                    INSERT INTO security_accounts
                    (
                        username,
                        password_hash,
                        display_name,
                        is_active,
                        must_change_password,
                        password_changed_at,
                        failed_login_attempts,
                        locked_until,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        LOWER($1),
                        $2,
                        $3,
                        true,
                        true,
                        NULL,
                        0,
                        NULL,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                    RETURNING
                        id,
                        username,
                        display_name,
                        is_active,
                        must_change_password,
                        failed_login_attempts,
                        locked_until,
                        created_at,
                        updated_at
                `,
                [
                    username,
                    passwordHash,
                    displayName
                ]
            );


        const account =
            accountResult.rows[0];


        await createAuditLog(
            client,
            req,
            "CREATE_SECURITY_ACCOUNT",
            "SECURITY_ACCOUNT",
            account.id,
            `Created security account ${username} for ${displayName}.`
        );


        await client.query("COMMIT");


        res.status(201).json({

            success: true,

            message:
                "Security account created successfully.",

            account: {

                ...account,

                account_type:
                    "SECURITY",

                login_id:
                    account.username

            },

            temporary_password:
                temporaryPassword,

            password_notice:
                "This temporary password is displayed only in this response. The user must change it after login."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Create security account error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "This security username already exists."

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Unable to create security account.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// RESET ACCOUNT PASSWORD
//
// PUT /api/admin/access/accounts/:type/:id/reset-password
//
// Type: official or security
//
// Body:
// {
//     "temporary_password": "Reset@123"
// }
// =====================================================

const resetAccountPassword = async (
    req,
    res
) => {

    const client =
        await pool.connect();


    try {

        const accountType =
            getAccountType(
                req.params.type
            );


        const accountId =
            Number.parseInt(
                req.params.id,
                10
            );


        const temporaryPassword =
            cleanText(
                req.body.temporary_password
            );


        if (!accountType) {

            return res.status(400).json({

                success: false,

                message:
                    "Account type must be OFFICIAL or SECURITY."

            });

        }


        if (!Number.isInteger(accountId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID."

            });

        }


        const passwordError =
            validatePassword(
                temporaryPassword
            );


        if (passwordError) {

            return res.status(400).json({

                success: false,

                message:
                    passwordError

            });

        }


        const tableName =
            accountType === "OFFICIAL"
                ? "official_accounts"
                : "security_accounts";


        await client.query("BEGIN");


        const existingResult =
            await client.query(
                `
                    SELECT id
                    FROM ${tableName}
                    WHERE id = $1
                    FOR UPDATE
                `,
                [accountId]
            );


        if (existingResult.rows.length === 0) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    `${accountType.toLowerCase()} account not found.`

            });

        }


        const passwordHash =
            await bcrypt.hash(
                temporaryPassword,
                PASSWORD_SALT_ROUNDS
            );


        await client.query(
            `
                UPDATE ${tableName}
                SET
                    password_hash = $1,
                    must_change_password = true,
                    password_changed_at =
                        CURRENT_TIMESTAMP,
                    failed_login_attempts = 0,
                    locked_until = NULL,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
            `,
            [
                passwordHash,
                accountId
            ]
        );


        await createAuditLog(
            client,
            req,
            "RESET_PASSWORD",
            `${accountType}_ACCOUNT`,
            accountId,
            `Reset password for ${accountType.toLowerCase()} account ID ${accountId}.`
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message:
                "Account password reset successfully.",

            account_type:
                accountType,

            account_id:
                accountId,

            temporary_password:
                temporaryPassword,

            must_change_password:
                true,

            password_notice:
                "This temporary password is displayed only in this response."

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Reset account password error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to reset account password.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// ACTIVATE OR DEACTIVATE ACCOUNT
//
// PUT /api/admin/access/accounts/:type/:id/status
//
// Body:
// {
//     "is_active": false
// }
// =====================================================

const updateAccountStatus = async (
    req,
    res
) => {

    const client =
        await pool.connect();


    try {

        const accountType =
            getAccountType(
                req.params.type
            );


        const accountId =
            Number.parseInt(
                req.params.id,
                10
            );


        if (!accountType) {

            return res.status(400).json({

                success: false,

                message:
                    "Account type must be OFFICIAL or SECURITY."

            });

        }


        if (!Number.isInteger(accountId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID."

            });

        }


        if (
            typeof req.body.is_active !==
            "boolean"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "is_active must be true or false."

            });

        }


        const isActive =
            req.body.is_active;


        const tableName =
            accountType === "OFFICIAL"
                ? "official_accounts"
                : "security_accounts";


        await client.query("BEGIN");


        if (
            accountType === "OFFICIAL" &&
            isActive
        ) {

            const employeeResult =
                await client.query(
                    `
                        SELECT e.is_active
                        FROM official_accounts oa
                        INNER JOIN employees e
                            ON e.id = oa.employee_id
                        WHERE oa.id = $1
                    `,
                    [accountId]
                );


            if (
                employeeResult.rows.length === 0
            ) {

                await client.query("ROLLBACK");


                return res.status(404).json({

                    success: false,

                    message:
                        "Official account not found."

                });

            }


            if (
                !employeeResult.rows[0].is_active
            ) {

                await client.query("ROLLBACK");


                return res.status(400).json({

                    success: false,

                    message:
                        "Activate the employee before activating their official account."

                });

            }

        }


        const updateResult =
            await client.query(
                `
                    UPDATE ${tableName}
                    SET
                        is_active = $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING
                        id,
                        is_active,
                        updated_at
                `,
                [
                    isActive,
                    accountId
                ]
            );


        if (updateResult.rows.length === 0) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    `${accountType.toLowerCase()} account not found.`

            });

        }


        await createAuditLog(
            client,
            req,
            isActive
                ? "ACTIVATE_ACCOUNT"
                : "DEACTIVATE_ACCOUNT",
            `${accountType}_ACCOUNT`,
            accountId,
            `${
                isActive
                    ? "Activated"
                    : "Deactivated"
            } ${accountType.toLowerCase()} account ID ${accountId}.`
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message: isActive
                ? "Account activated successfully."
                : "Account deactivated successfully.",

            account_type:
                accountType,

            account:
                updateResult.rows[0]

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Update account status error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to update account status.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// UNLOCK ACCOUNT
//
// PUT /api/admin/access/accounts/:type/:id/unlock
// =====================================================

const unlockAccount = async (req, res) => {

    const client =
        await pool.connect();


    try {

        const accountType =
            getAccountType(
                req.params.type
            );


        const accountId =
            Number.parseInt(
                req.params.id,
                10
            );


        if (!accountType) {

            return res.status(400).json({

                success: false,

                message:
                    "Account type must be OFFICIAL or SECURITY."

            });

        }


        if (!Number.isInteger(accountId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid account ID."

            });

        }


        const tableName =
            accountType === "OFFICIAL"
                ? "official_accounts"
                : "security_accounts";


        await client.query("BEGIN");


        const result =
            await client.query(
                `
                    UPDATE ${tableName}
                    SET
                        failed_login_attempts = 0,
                        locked_until = NULL,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $1
                    RETURNING
                        id,
                        failed_login_attempts,
                        locked_until,
                        updated_at
                `,
                [accountId]
            );


        if (result.rows.length === 0) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    `${accountType.toLowerCase()} account not found.`

            });

        }


        await createAuditLog(
            client,
            req,
            "UNLOCK_ACCOUNT",
            `${accountType}_ACCOUNT`,
            accountId,
            `Unlocked ${accountType.toLowerCase()} account ID ${accountId}.`
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message:
                "Account unlocked successfully.",

            account_type:
                accountType,

            account:
                result.rows[0]

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Unlock account error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to unlock account.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getAccounts,

    createOfficialAccount,

    createSecurityAccount,

    resetAccountPassword,

    updateAccountStatus,

    unlockAccount

};