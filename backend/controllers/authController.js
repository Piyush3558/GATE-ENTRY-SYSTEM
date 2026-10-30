const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool =
    require("../config/database");


// =====================================================
// SETTINGS
// =====================================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;


// =====================================================
// CREATE JWT
// =====================================================

const createToken = (payload) => {

    if (!process.env.JWT_SECRET) {

        throw new Error(
            "JWT_SECRET is not configured."
        );

    }


    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        {
            expiresIn: "8h"
        }
    );

};


// =====================================================
// INVALID LOGIN RESPONSE
// =====================================================

const sendInvalidLogin = (res) => {

    return res.status(401).json({

        success: false,

        message:
            "Invalid username/email or password."

    });

};


// =====================================================
// CHECK WHETHER ACCOUNT IS LOCKED
// =====================================================

const isAccountLocked = (lockedUntil) => {

    if (!lockedUntil) {
        return false;
    }


    return (
        new Date(lockedUntil) >
        new Date()
    );

};


// =====================================================
// RECORD FAILED LOGIN
// =====================================================

const recordFailedLogin = async (
    tableName,
    accountId
) => {

    const allowedTables = [
        "admin_accounts",
        "security_accounts",
        "official_accounts"
    ];


    if (
        !allowedTables.includes(
            tableName
        )
    ) {

        throw new Error(
            "Invalid account table."
        );

    }


    await pool.query(
        `
            UPDATE ${tableName}
            SET
                failed_login_attempts =
                    failed_login_attempts + 1,

                locked_until =
                    CASE
                        WHEN
                            failed_login_attempts + 1
                            >= $1
                        THEN
                            CURRENT_TIMESTAMP
                            + (
                                $2
                                * INTERVAL '1 minute'
                            )
                        ELSE
                            locked_until
                    END,

                updated_at =
                    CURRENT_TIMESTAMP

            WHERE id = $3
        `,
        [
            MAX_FAILED_ATTEMPTS,
            LOCK_DURATION_MINUTES,
            accountId
        ]
    );

};


// =====================================================
// CLEAR FAILED LOGIN
// =====================================================

const clearFailedLogin = async (
    tableName,
    accountId
) => {

    const allowedTables = [
        "admin_accounts",
        "security_accounts",
        "official_accounts"
    ];


    if (
        !allowedTables.includes(
            tableName
        )
    ) {

        throw new Error(
            "Invalid account table."
        );

    }


    await pool.query(
        `
            UPDATE ${tableName}
            SET
                failed_login_attempts = 0,
                locked_until = NULL,
                updated_at =
                    CURRENT_TIMESTAMP
            WHERE id = $1
        `,
        [accountId]
    );

};


// =====================================================
// COMMON LOGIN
// ADMIN / SECURITY / OFFICIAL
// =====================================================

const login = async (req, res) => {

    try {

        const loginId =
            String(
                req.body.login_id || ""
            ).trim();


        const password =
            String(
                req.body.password || ""
            );


        if (!loginId || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Username or official email and password are required."

            });

        }


        const normalizedLoginId =
            loginId.toLowerCase();


            const officeEmailPattern =
    /^[A-Z0-9._%+-]+@in\.ufifilters\.com$/i;


if (
    normalizedLoginId.includes("@") &&
    !officeEmailPattern.test(
        normalizedLoginId
    )
) {

    return res.status(400).json({

        success: false,

        message:
            "Only @in.ufifilters.com official email addresses are allowed."

    });

}

        // =================================================
        // ADMIN LOGIN
        // =================================================

        const adminResult =
    await pool.query(
        `
            SELECT
                id,
                username,
                password_hash,
                display_name,
                email,
                is_active,
                must_change_password,
                failed_login_attempts,
                locked_until

            FROM admin_accounts

            WHERE LOWER(username) =
                LOWER($1)

            LIMIT 1
        `,
        [normalizedLoginId]
    );


        if (
            adminResult.rows.length > 0
        ) {

            const admin =
                adminResult.rows[0];


            if (!admin.is_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your administrator account is inactive."

                });

            }


            if (
                isAccountLocked(
                    admin.locked_until
                )
            ) {

                return res.status(423).json({

                    success: false,

                    message:
                        "Your administrator account is temporarily locked. Please try again later or contact another administrator."

                });

            }


            const passwordMatches =
                await bcrypt.compare(
                    password,
                    admin.password_hash
                );


            if (!passwordMatches) {

                await recordFailedLogin(
                    "admin_accounts",
                    admin.id
                );


                return sendInvalidLogin(res);

            }


            await clearFailedLogin(
                "admin_accounts",
                admin.id
            );


            const token =
                createToken({

                    role: "ADMIN",

                    adminAccountId:
                        admin.id,

                    username:
                        admin.username

                });


            return res.status(200).json({

                success: true,

                message:
                    "Administrator login successful.",

                token,

                user: {

                    id:
                        admin.id,

                    username:
                        admin.username,

                    name:
                        admin.display_name,

                    email:
                        admin.email,

                    role:
                        "ADMIN",

                    must_change_password:
                        Boolean(
                            admin.must_change_password
                        )

                }

            });

        }


        // =================================================
        // SECURITY LOGIN
        // =================================================

        const securityResult =
            await pool.query(
                `
                    SELECT
                        id,
                        username,
                        password_hash,
                        display_name,
                        is_active,
                        must_change_password,
                        failed_login_attempts,
                        locked_until

                    FROM security_accounts

                    WHERE LOWER(username) =
                        LOWER($1)

                    LIMIT 1
                `,
                [normalizedLoginId]
            );


        if (
            securityResult.rows.length > 0
        ) {

            const security =
                securityResult.rows[0];


            if (!security.is_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Your security account is inactive."

                });

            }


            if (
                isAccountLocked(
                    security.locked_until
                )
            ) {

                return res.status(423).json({

                    success: false,

                    message:
                        "Your security account is temporarily locked. Please try again later or contact the administrator."

                });

            }


            const passwordMatches =
                await bcrypt.compare(
                    password,
                    security.password_hash
                );


            if (!passwordMatches) {

                await recordFailedLogin(
                    "security_accounts",
                    security.id
                );


                return sendInvalidLogin(res);

            }


            await clearFailedLogin(
                "security_accounts",
                security.id
            );


            const token =
                createToken({

                    role:
                        "SECURITY",

                    securityAccountId:
                        security.id,

                    username:
                        security.username

                });


            return res.status(200).json({

                success: true,

                message:
                    "Security login successful.",

                token,

                user: {

                    id:
                        security.id,

                    username:
                        security.username,

                    name:
                        security.display_name,

                    role:
                        "SECURITY",

                    must_change_password:
                        Boolean(
                            security.must_change_password
                        )

                }

            });

        }


        // =================================================
        // OFFICIAL LOGIN
        // =================================================

        const officialResult =
            await pool.query(
                `
                    SELECT
                        oa.id,
                        oa.employee_id,
                        oa.email,
                        oa.password_hash,
                        oa.is_active,
                        oa.must_change_password,
                        oa.failed_login_attempts,
                        oa.locked_until,

                        e.employee_name,
                        e.employee_code,
                        e.department_id,
                        e.unit,
                        e.is_active AS employee_active,

                        d.department_name

                    FROM official_accounts oa

                    INNER JOIN employees e
                        ON e.id =
                            oa.employee_id

                    LEFT JOIN departments d
                        ON d.id =
                            e.department_id

                    WHERE
                        LOWER(oa.email) =
                            LOWER($1)
                        OR LOWER(e.employee_code) =
                            LOWER($1)

                    LIMIT 1
                `,
                [normalizedLoginId]
            );


        if (
            officialResult.rows.length === 0
        ) {

            return sendInvalidLogin(res);

        }


        const official =
            officialResult.rows[0];


        if (!official.employee_active) {

            return res.status(403).json({

                success: false,

                message:
                    "Your employee account is inactive."

            });

        }


        if (!official.is_active) {

            return res.status(403).json({

                success: false,

                message:
                    "Your official account is inactive."

            });

        }


        if (
            isAccountLocked(
                official.locked_until
            )
        ) {

            return res.status(423).json({

                success: false,

                message:
                    "Your official account is temporarily locked. Please try again later or contact the administrator."

            });

        }


        const passwordMatches =
            await bcrypt.compare(
                password,
                official.password_hash
            );


        if (!passwordMatches) {

            await recordFailedLogin(
                "official_accounts",
                official.id
            );


            return sendInvalidLogin(res);

        }


        await clearFailedLogin(
            "official_accounts",
            official.id
        );


        const token =
            createToken({

                role:
                    "OFFICIAL",

                officialAccountId:
                    official.id,

                employeeId:
                    official.employee_id,

                email:
                    official.email

            });


        return res.status(200).json({

            success: true,

            message:
                "Official login successful.",

            token,

            user: {

                id:
                    official.id,

                employee_id:
                    official.employee_id,

                employee_name:
                    official.employee_name,

                employee_code:
                    official.employee_code,

                name:
                    official.employee_name,

                email:
                    official.email,

                department_id:
                    official.department_id,

                department_name:
                    official.department_name,

                unit:
                    official.unit,

                role:
                    "OFFICIAL",

                must_change_password:
                    Boolean(
                        official.must_change_password
                    )

            }

        });

    }

    catch (error) {

        console.error(
            "Common login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to complete login.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET CURRENT USER
// =====================================================

const getCurrentUser = async (req, res) => {

    try {

        const authenticatedUser =
            req.authUser;


        // =================================================
        // ADMIN
        // =================================================

        if (
            authenticatedUser.role ===
            "ADMIN"
        ) {

            const result =
                await pool.query(
                    `
                        SELECT
                            id,
                            username,
                            display_name,
                            email,
                            is_active,
                            must_change_password

                        FROM admin_accounts

                        WHERE id = $1

                        LIMIT 1
                    `,
                    [
                        authenticatedUser
                            .adminAccountId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Administrator account not found."

                });

            }


            const account =
                result.rows[0];


            if (!account.is_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Administrator account is inactive."

                });

            }


            return res.status(200).json({

                success: true,

                user: {

                    id:
                        account.id,

                    username:
                        account.username,

                    name:
                        account.display_name,

                    email:
                        account.email,

                    role:
                        "ADMIN",

                    must_change_password:
                        Boolean(
                            account.must_change_password
                        )

                }

            });

        }


        // =================================================
        // SECURITY
        // =================================================

        if (
            authenticatedUser.role ===
            "SECURITY"
        ) {

            const result =
                await pool.query(
                    `
                        SELECT
                            id,
                            username,
                            display_name,
                            is_active,
                            must_change_password

                        FROM security_accounts

                        WHERE id = $1

                        LIMIT 1
                    `,
                    [
                        authenticatedUser
                            .securityAccountId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Security account not found."

                });

            }


            const account =
                result.rows[0];


            if (!account.is_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Security account is inactive."

                });

            }


            return res.status(200).json({

                success: true,

                user: {

                    id:
                        account.id,

                    username:
                        account.username,

                    name:
                        account.display_name,

                    role:
                        "SECURITY",

                    must_change_password:
                        Boolean(
                            account.must_change_password
                        )

                }

            });

        }


        // =================================================
        // OFFICIAL
        // =================================================

        if (
            authenticatedUser.role ===
            "OFFICIAL"
        ) {

            const result =
                await pool.query(
                    `
                        SELECT
                            oa.id,
                            oa.employee_id,
                            oa.email,
                            oa.is_active,
                            oa.must_change_password,

                            e.employee_name,
                            e.employee_code,
                            e.department_id,
                            e.unit,
                            e.is_active AS employee_active,

                            d.department_name

                        FROM official_accounts oa

                        INNER JOIN employees e
                            ON e.id =
                                oa.employee_id

                        LEFT JOIN departments d
                            ON d.id =
                                e.department_id

                        WHERE oa.id = $1
                          AND oa.employee_id = $2

                        LIMIT 1
                    `,
                    [
                        authenticatedUser
                            .officialAccountId,

                        authenticatedUser
                            .employeeId
                    ]
                );


            if (
                result.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Official account not found."

                });

            }


            const account =
                result.rows[0];


            if (!account.employee_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Employee account is inactive."

                });

            }


            if (!account.is_active) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Official account is inactive."

                });

            }


            return res.status(200).json({

                success: true,

                user: {

                    id:
                        account.id,

                    employee_id:
                        account.employee_id,

                    employee_name:
                        account.employee_name,

                    employee_code:
                        account.employee_code,

                    name:
                        account.employee_name,

                    email:
                        account.email,

                    department_id:
                        account.department_id,

                    department_name:
                        account.department_name,

                    unit:
                        account.unit,

                    role:
                        "OFFICIAL",

                    must_change_password:
                        Boolean(
                            account.must_change_password
                        )

                }

            });

        }


        return res.status(403).json({

            success: false,

            message:
                "Invalid account role."

        });

    }

    catch (error) {

        console.error(
            "Get current user error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to validate the current session.",

            error:
                error.message

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    login,

    getCurrentUser

};
