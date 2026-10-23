const pool = require("../config/database");

// =====================================================
// HELPER: CLEAN OPTIONAL TEXT
// =====================================================

const cleanOptionalText = (value) => {

    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    const cleanedValue =
        String(value).trim();

    return cleanedValue || null;
};


// =====================================================
// HELPER: WRITE ADMIN AUDIT LOG
// Must be called using a transaction client.
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
// GET ALL EMPLOYEES
//
// GET /api/admin/access/employees
//
// Optional query parameters:
// search
// department_id
// status = ACTIVE | INACTIVE
// account_status = CREATED | NOT_CREATED
// page
// limit
// =====================================================

const getEmployees = async (req, res) => {

    try {

        const {
            search = "",
            department_id,
            status,
            account_status
        } = req.query;


        const requestedPage =
            Number.parseInt(req.query.page, 10);

        const requestedLimit =
            Number.parseInt(req.query.limit, 10);


        const page =
            Number.isInteger(requestedPage) &&
            requestedPage > 0
                ? requestedPage
                : 1;


        const limit =
            Number.isInteger(requestedLimit) &&
            requestedLimit > 0
                ? Math.min(requestedLimit, 100)
                : 20;


        const offset =
            (page - 1) * limit;


        const conditions = [];

        const values = [];


        // =================================================
        // SEARCH FILTER
        // =================================================

        const cleanedSearch =
            String(search).trim();


        if (cleanedSearch) {

            values.push(
                `%${cleanedSearch}%`
            );


            conditions.push(
                `
                    (
                        e.employee_name ILIKE $${values.length}
                        OR e.employee_code ILIKE $${values.length}
                        OR e.email ILIKE $${values.length}
                        OR e.unit ILIKE $${values.length}
                        OR d.department_name ILIKE $${values.length}
                    )
                `
            );

        }


        // =================================================
        // DEPARTMENT FILTER
        // =================================================

        if (
            department_id !== undefined &&
            department_id !== null &&
            String(department_id).trim() !== ""
        ) {

            const departmentId =
                Number.parseInt(
                    department_id,
                    10
                );


            if (!Number.isInteger(departmentId)) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid department ID."

                });

            }


            values.push(departmentId);

            conditions.push(
                `e.department_id = $${values.length}`
            );

        }


        // =================================================
        // EMPLOYEE STATUS FILTER
        // =================================================

        if (status) {

            const normalizedStatus =
                String(status)
                    .trim()
                    .toUpperCase();


            if (
                ![
                    "ACTIVE",
                    "INACTIVE"
                ].includes(normalizedStatus)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Employee status must be ACTIVE or INACTIVE."

                });

            }


            values.push(
                normalizedStatus === "ACTIVE"
            );


            conditions.push(
                `e.is_active = $${values.length}`
            );

        }


        // =================================================
        // OFFICIAL ACCOUNT FILTER
        // =================================================

        if (account_status) {

            const normalizedAccountStatus =
                String(account_status)
                    .trim()
                    .toUpperCase();


            if (
                ![
                    "CREATED",
                    "NOT_CREATED"
                ].includes(
                    normalizedAccountStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Account status must be CREATED or NOT_CREATED."

                });

            }


            if (
                normalizedAccountStatus ===
                "CREATED"
            ) {

                conditions.push(
                    "oa.id IS NOT NULL"
                );

            }

            else {

                conditions.push(
                    "oa.id IS NULL"
                );

            }

        }


        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";


        // =================================================
        // COUNT EMPLOYEES
        // =================================================

        const countResult =
            await pool.query(
                `
                    SELECT
                        COUNT(*)::integer AS total
                    FROM employees e
                    INNER JOIN departments d
                        ON d.id = e.department_id
                    LEFT JOIN official_accounts oa
                        ON oa.employee_id = e.id
                    ${whereClause}
                `,
                values
            );


        const total =
            countResult.rows[0].total;


        // =================================================
        // GET EMPLOYEES
        // =================================================

        const dataValues = [
            ...values,
            limit,
            offset
        ];


        const limitParameter =
            values.length + 1;

        const offsetParameter =
            values.length + 2;


        const employeeResult =
            await pool.query(
                `
                    SELECT
                        e.id,
                        e.employee_code,
                        e.employee_name,
                        e.department_id,
                        d.department_name,
                        e.email,
                        e.unit,
                        e.is_active,
                        e.created_at,
                        e.updated_at,

                        oa.id AS official_account_id,
                        oa.email AS official_login_email,
                        oa.is_active AS official_account_active,
                        oa.must_change_password,
                        oa.failed_login_attempts,
                        oa.locked_until,
                        oa.password_changed_at,
                        oa.created_at AS account_created_at,
                        oa.updated_at AS account_updated_at,

                        CASE
                            WHEN oa.id IS NULL
                                THEN false
                            ELSE true
                        END AS has_official_account

                    FROM employees e

                    INNER JOIN departments d
                        ON d.id = e.department_id

                    LEFT JOIN official_accounts oa
                        ON oa.employee_id = e.id

                    ${whereClause}

                    ORDER BY
                        e.employee_name ASC,
                        e.id ASC

                    LIMIT $${limitParameter}
                    OFFSET $${offsetParameter}
                `,
                dataValues
            );


        const totalPages =
            total === 0
                ? 0
                : Math.ceil(total / limit);


        res.json({

            success: true,

            count:
                employeeResult.rows.length,

            total,

            pagination: {

                page,

                limit,

                total_pages:
                    totalPages

            },

            employees:
                employeeResult.rows

        });

    }

    catch (error) {

        console.error(
            "Get admin employees error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to load employees.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET ONE EMPLOYEE
//
// GET /api/admin/access/employees/:id
// =====================================================

const getEmployeeById = async (req, res) => {

    try {

        const employeeId =
            Number.parseInt(
                req.params.id,
                10
            );


        if (!Number.isInteger(employeeId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid employee ID."

            });

        }


        const result =
            await pool.query(
                `
                    SELECT
                        e.id,
                        e.employee_code,
                        e.employee_name,
                        e.department_id,
                        d.department_name,
                        e.email,
                        e.unit,
                        e.is_active,
                        e.created_at,
                        e.updated_at,

                        oa.id AS official_account_id,
                        oa.email AS official_login_email,
                        oa.is_active AS official_account_active,
                        oa.must_change_password,
                        oa.failed_login_attempts,
                        oa.locked_until,
                        oa.password_changed_at,
                        oa.created_at AS account_created_at,
                        oa.updated_at AS account_updated_at,

                        CASE
                            WHEN oa.id IS NULL
                                THEN false
                            ELSE true
                        END AS has_official_account

                    FROM employees e

                    INNER JOIN departments d
                        ON d.id = e.department_id

                    LEFT JOIN official_accounts oa
                        ON oa.employee_id = e.id

                    WHERE e.id = $1
                `,
                [employeeId]
            );


        if (result.rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Employee not found."

            });

        }


        res.json({

            success: true,

            employee:
                result.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Get employee details error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to load employee details.",

            error:
                error.message

        });

    }

};


// =====================================================
// CREATE EMPLOYEE
//
// POST /api/admin/access/employees
//
// Body:
// {
//     "employee_code": "25K04A31",
//     "employee_name": "EMPLOYEE NAME",
//     "department_id": 8,
//     "email": "employee@company.com",
//     "unit": "UFI BAWAL"
// }
// =====================================================

const createEmployee = async (req, res) => {

    const client =
        await pool.connect();


    try {

        const employeeCode =
            cleanOptionalText(
                req.body.employee_code
            );


        const employeeName =
            cleanOptionalText(
                req.body.employee_name
            );


        const emailValue =
            cleanOptionalText(
                req.body.email
            );


        const email =
            emailValue
                ? emailValue.toLowerCase()
                : null;


        const unit =
            cleanOptionalText(
                req.body.unit
            );


        const departmentId =
            Number.parseInt(
                req.body.department_id,
                10
            );


        if (!employeeName) {

            return res.status(400).json({

                success: false,

                message:
                    "Employee name is required."

            });

        }


        if (!Number.isInteger(departmentId)) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid department is required."

            });

        }


        await client.query("BEGIN");


        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        const departmentResult =
            await client.query(
                `
                    SELECT
                        id,
                        department_name
                    FROM departments
                    WHERE id = $1
                `,
                [departmentId]
            );


        if (
            departmentResult.rows.length === 0
        ) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    "Selected department does not exist."

            });

        }


        // =================================================
        // CHECK EMPLOYEE CODE
        // =================================================

        if (employeeCode) {

            const employeeCodeResult =
                await client.query(
                    `
                        SELECT id
                        FROM employees
                        WHERE LOWER(employee_code)
                            = LOWER($1)
                        LIMIT 1
                    `,
                    [employeeCode]
                );


            if (
                employeeCodeResult.rows.length > 0
            ) {

                await client.query("ROLLBACK");


                return res.status(409).json({

                    success: false,

                    message:
                        "This employee code is already registered."

                });

            }

        }


        // =================================================
        // CHECK EMPLOYEE EMAIL
        // =================================================

        if (email) {

            const employeeEmailResult =
                await client.query(
                    `
                        SELECT id
                        FROM employees
                        WHERE LOWER(email)
                            = LOWER($1)
                        LIMIT 1
                    `,
                    [email]
                );


            if (
                employeeEmailResult.rows.length > 0
            ) {

                await client.query("ROLLBACK");


                return res.status(409).json({

                    success: false,

                    message:
                        "This employee email is already registered."

                });

            }

        }


        // =================================================
        // INSERT EMPLOYEE
        // =================================================

        const insertResult =
            await client.query(
                `
                    INSERT INTO employees
                    (
                        employee_code,
                        employee_name,
                        department_id,
                        email,
                        unit,
                        is_active,
                        created_at,
                        updated_at
                    )
                    VALUES
                    (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        true,
                        CURRENT_TIMESTAMP,
                        CURRENT_TIMESTAMP
                    )
                    RETURNING
                        id,
                        employee_code,
                        employee_name,
                        department_id,
                        email,
                        unit,
                        is_active,
                        created_at,
                        updated_at
                `,
                [
                    employeeCode,
                    employeeName,
                    departmentId,
                    email,
                    unit
                ]
            );


        const employee =
            insertResult.rows[0];


        employee.department_name =
            departmentResult.rows[0]
                .department_name;


        employee.has_official_account =
            false;


        // =================================================
        // AUDIT LOG
        // =================================================

        await createAuditLog(
            client,
            req,
            "CREATE_EMPLOYEE",
            "EMPLOYEE",
            employee.id,
            `Created employee ${employeeName}${
                employeeCode
                    ? ` (${employeeCode})`
                    : ""
            }.`
        );


        await client.query("COMMIT");


        res.status(201).json({

            success: true,

            message:
                "Employee created successfully.",

            employee

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Create employee error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "Employee code or email already exists."

            });

        }


        if (error.code === "23503") {

            return res.status(400).json({

                success: false,

                message:
                    "The selected department is invalid."

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Unable to create employee.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// UPDATE EMPLOYEE
//
// PUT /api/admin/access/employees/:id
// =====================================================

const updateEmployee = async (req, res) => {

    const client =
        await pool.connect();


    try {

        const employeeId =
            Number.parseInt(
                req.params.id,
                10
            );


        if (!Number.isInteger(employeeId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid employee ID."

            });

        }


        const employeeCode =
            cleanOptionalText(
                req.body.employee_code
            );


        const employeeName =
            cleanOptionalText(
                req.body.employee_name
            );


        const emailValue =
            cleanOptionalText(
                req.body.email
            );


        const email =
            emailValue
                ? emailValue.toLowerCase()
                : null;


        const unit =
            cleanOptionalText(
                req.body.unit
            );


        const departmentId =
            Number.parseInt(
                req.body.department_id,
                10
            );


        if (!employeeName) {

            return res.status(400).json({

                success: false,

                message:
                    "Employee name is required."

            });

        }


        if (!Number.isInteger(departmentId)) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid department is required."

            });

        }


        await client.query("BEGIN");


        // =================================================
        // CHECK EMPLOYEE
        // =================================================

        const existingEmployeeResult =
            await client.query(
                `
                    SELECT *
                    FROM employees
                    WHERE id = $1
                    FOR UPDATE
                `,
                [employeeId]
            );


        if (
            existingEmployeeResult.rows.length ===
            0
        ) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    "Employee not found."

            });

        }


        // =================================================
        // CHECK DEPARTMENT
        // =================================================

        const departmentResult =
            await client.query(
                `
                    SELECT
                        id,
                        department_name
                    FROM departments
                    WHERE id = $1
                `,
                [departmentId]
            );


        if (
            departmentResult.rows.length === 0
        ) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    "Selected department does not exist."

            });

        }


        // =================================================
        // CHECK DUPLICATE EMPLOYEE CODE
        // =================================================

        if (employeeCode) {

            const duplicateCodeResult =
                await client.query(
                    `
                        SELECT id
                        FROM employees
                        WHERE LOWER(employee_code)
                            = LOWER($1)
                          AND id <> $2
                        LIMIT 1
                    `,
                    [
                        employeeCode,
                        employeeId
                    ]
                );


            if (
                duplicateCodeResult.rows.length >
                0
            ) {

                await client.query("ROLLBACK");


                return res.status(409).json({

                    success: false,

                    message:
                        "This employee code is already registered."

                });

            }

        }


        // =================================================
        // CHECK DUPLICATE EMAIL
        // =================================================

        if (email) {

            const duplicateEmailResult =
                await client.query(
                    `
                        SELECT id
                        FROM employees
                        WHERE LOWER(email)
                            = LOWER($1)
                          AND id <> $2
                        LIMIT 1
                    `,
                    [
                        email,
                        employeeId
                    ]
                );


            if (
                duplicateEmailResult.rows.length >
                0
            ) {

                await client.query("ROLLBACK");


                return res.status(409).json({

                    success: false,

                    message:
                        "This employee email is already registered."

                });

            }


            const officialEmailResult =
                await client.query(
                    `
                        SELECT
                            id,
                            employee_id
                        FROM official_accounts
                        WHERE LOWER(email)
                            = LOWER($1)
                          AND employee_id <> $2
                        LIMIT 1
                    `,
                    [
                        email,
                        employeeId
                    ]
                );


            if (
                officialEmailResult.rows.length >
                0
            ) {

                await client.query("ROLLBACK");


                return res.status(409).json({

                    success: false,

                    message:
                        "This email is already used by another official account."

                });

            }

        }


        // =================================================
        // UPDATE EMPLOYEE
        // =================================================

        const updateResult =
            await client.query(
                `
                    UPDATE employees
                    SET
                        employee_code = $1,
                        employee_name = $2,
                        department_id = $3,
                        email = $4,
                        unit = $5,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $6
                    RETURNING
                        id,
                        employee_code,
                        employee_name,
                        department_id,
                        email,
                        unit,
                        is_active,
                        created_at,
                        updated_at
                `,
                [
                    employeeCode,
                    employeeName,
                    departmentId,
                    email,
                    unit,
                    employeeId
                ]
            );


        // Keep the official login email synchronized.
        // This only runs when the employee already has
        // an official account and has a valid email.

        if (email) {

            await client.query(
                `
                    UPDATE official_accounts
                    SET
                        email = $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE employee_id = $2
                `,
                [
                    email,
                    employeeId
                ]
            );

        }


        const employee =
            updateResult.rows[0];


        employee.department_name =
            departmentResult.rows[0]
                .department_name;


        // =================================================
        // AUDIT LOG
        // =================================================

        await createAuditLog(
            client,
            req,
            "UPDATE_EMPLOYEE",
            "EMPLOYEE",
            employeeId,
            `Updated employee ${employeeName}${
                employeeCode
                    ? ` (${employeeCode})`
                    : ""
            }.`
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message:
                "Employee updated successfully.",

            employee

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Update employee error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({

                success: false,

                message:
                    "Employee code or email already exists."

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Unable to update employee.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


// =====================================================
// ACTIVATE OR DEACTIVATE EMPLOYEE
//
// PUT /api/admin/access/employees/:id/status
//
// Body:
// {
//     "is_active": false
// }
// =====================================================

const updateEmployeeStatus = async (
    req,
    res
) => {

    const client =
        await pool.connect();


    try {

        const employeeId =
            Number.parseInt(
                req.params.id,
                10
            );


        if (!Number.isInteger(employeeId)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid employee ID."

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


        await client.query("BEGIN");


        const employeeResult =
            await client.query(
                `
                    UPDATE employees
                    SET
                        is_active = $1,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE id = $2
                    RETURNING
                        id,
                        employee_code,
                        employee_name,
                        department_id,
                        email,
                        unit,
                        is_active,
                        created_at,
                        updated_at
                `,
                [
                    isActive,
                    employeeId
                ]
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


        /*
         * When an employee is deactivated,
         * their official login is also deactivated.
         *
         * When an employee is reactivated,
         * the official account is not automatically
         * reactivated. The admin must reactivate it
         * separately.
         */

        if (!isActive) {

            await client.query(
                `
                    UPDATE official_accounts
                    SET
                        is_active = false,
                        updated_at =
                            CURRENT_TIMESTAMP
                    WHERE employee_id = $1
                `,
                [employeeId]
            );

        }


        const employee =
            employeeResult.rows[0];


        await createAuditLog(
            client,
            req,
            isActive
                ? "ACTIVATE_EMPLOYEE"
                : "DEACTIVATE_EMPLOYEE",
            "EMPLOYEE",
            employeeId,
            `${
                isActive
                    ? "Activated"
                    : "Deactivated"
            } employee ${
                employee.employee_name
            }.`
        );


        await client.query("COMMIT");


        res.json({

            success: true,

            message: isActive
                ? "Employee activated successfully."
                : "Employee and associated official account deactivated successfully.",

            employee

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Update employee status error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to update employee status.",

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

    getEmployees,

    getEmployeeById,

    createEmployee,

    updateEmployee,

    updateEmployeeStatus

};