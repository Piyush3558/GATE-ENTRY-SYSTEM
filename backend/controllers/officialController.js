const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");


// =====================================================
// OFFICIAL LOGIN
// =====================================================

const loginOfficial = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (
            !email ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Email and password are required."

            });

        }


        const result = await pool.query(
            `
            SELECT
                oa.id,
                oa.employee_id,
                oa.email,
                oa.password_hash,
                oa.is_active,

                e.employee_name,
                e.employee_code,
                e.department_id,
                e.unit,

                d.department_name

            FROM official_accounts oa

            INNER JOIN employees e
                ON e.id = oa.employee_id

            LEFT JOIN departments d
                ON d.id = e.department_id

            WHERE LOWER(oa.email) =
                  LOWER($1)

            LIMIT 1
            `,
            [
                email.trim()
            ]
        );


        if (
            result.rows.length === 0
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        const official =
            result.rows[0];


        if (!official.is_active) {

            return res.status(403).json({

                success: false,

                message:
                    "Your official account is inactive. Please contact the administrator."

            });

        }


        const passwordMatch =
            await bcrypt.compare(
                password,
                official.password_hash
            );


        if (!passwordMatch) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid email or password."

            });

        }


        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is not configured."
            );


            return res.status(500).json({

                success: false,

                message:
                    "Authentication configuration error."

            });

        }


        const token =
            jwt.sign(
                {
                    officialAccountId:
                        official.id,

                    employeeId:
                        official.employee_id,

                    email:
                        official.email
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "8h"
                }
            );


        return res.status(200).json({

            success: true,

            message:
                "Official login successful.",

            token,

            official: {

                id:
                    official.id,

                employee_id:
                    official.employee_id,

                employee_name:
                    official.employee_name,

                employee_code:
                    official.employee_code,

                email:
                    official.email,

                department_id:
                    official.department_id,

                department_name:
                    official.department_name,

                unit:
                    official.unit

            }

        });

    }

    catch (error) {

        console.error(
            "Official login error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to login.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET LOGGED-IN OFFICIAL
// =====================================================

const getCurrentOfficial = async (req, res) => {

    try {

        const result = await pool.query(
            `
            SELECT
                oa.id,
                oa.employee_id,
                oa.email,
                oa.is_active,

                e.employee_name,
                e.employee_code,
                e.department_id,
                e.unit,

                d.department_name

            FROM official_accounts oa

            INNER JOIN employees e
                ON e.id = oa.employee_id

            LEFT JOIN departments d
                ON d.id = e.department_id

            WHERE oa.id = $1
              AND oa.employee_id = $2

            LIMIT 1
            `,
            [
                req.official.officialAccountId,
                req.official.employeeId
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


        const official =
            result.rows[0];


        if (!official.is_active) {

            return res.status(403).json({

                success: false,

                message:
                    "Your official account is inactive."

            });

        }


        return res.status(200).json({

            success: true,

            official: {

                id:
                    official.id,

                employee_id:
                    official.employee_id,

                employee_name:
                    official.employee_name,

                employee_code:
                    official.employee_code,

                email:
                    official.email,

                department_id:
                    official.department_id,

                department_name:
                    official.department_name,

                unit:
                    official.unit

            }

        });

    }

    catch (error) {

        console.error(
            "Get current official error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load official information.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET ASSIGNED VISITOR REQUESTS
// =====================================================

const getOfficialVisitors = async (req, res) => {

    try {

        const {
            status
        } = req.query;


        const allowedStatuses = [
            "PENDING",
            "APPROVED",
            "REJECTED"
        ];


        let statusCondition = "";

        const values = [
            req.official.employeeId
        ];


        if (
            status &&
            status.toUpperCase() !== "ALL"
        ) {

            const normalizedStatus =
                status.toUpperCase();


            if (
                !allowedStatuses.includes(
                    normalizedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid approval status."

                });

            }


            values.push(
                normalizedStatus
            );


            statusCondition =
                `AND ve.approval_status = $${values.length}`;

        }


        const result = await pool.query(
            `
            SELECT
                ve.id,

                TO_CHAR(
                    ve.visit_date,
                    'YYYY-MM-DD'
                ) AS visit_date,

                ve.visitor_name,
                ve.address,
                ve.mobile_number,
                ve.purpose_of_visit,
                ve.official_to_visit,
                ve.official_employee_id,
                ve.official_email,
                ve.approval_status,

                TO_CHAR(
                    ve.approval_time,
                    'DD-MM-YYYY HH12:MI AM'
                ) AS approval_time,

                ve.rejection_reason,
                ve.entry_status,

                TO_CHAR(
                    ve.time_in,
                    'HH12:MI AM'
                ) AS time_in,

                TO_CHAR(
                    ve.time_out,
                    'HH12:MI AM'
                ) AS time_out,

                ve.signature,
                ve.photo_path,
                ve.created_at,

                e.employee_name AS official_name,
                e.employee_code AS official_code,

                d.department_name

            FROM visitor_entries ve

            INNER JOIN employees e
                ON e.id =
                   ve.official_employee_id

            LEFT JOIN departments d
                ON d.id =
                   e.department_id

            WHERE ve.official_employee_id = $1

            ${statusCondition}

            ORDER BY
                CASE
                    WHEN ve.approval_status = 'PENDING'
                    THEN 1
                    ELSE 2
                END,
                ve.id DESC
            `,
            values
        );


        const summaryResult =
            await pool.query(
                `
                SELECT
                    COUNT(*)::integer
                        AS total,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'PENDING'
                    )::integer
                        AS pending,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'APPROVED'
                    )::integer
                        AS approved,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'REJECTED'
                    )::integer
                        AS rejected

                FROM visitor_entries

                WHERE official_employee_id = $1
                `,
                [
                    req.official.employeeId
                ]
            );


        return res.status(200).json({

            success: true,

            count:
                result.rows.length,

            summary:
                summaryResult.rows[0],

            visitors:
                result.rows

        });

    }

    catch (error) {

        console.error(
            "Get official visitors error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load visitor requests.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET ONE ASSIGNED VISITOR
// =====================================================

const getOfficialVisitorById = async (
    req,
    res
) => {

    try {

        const {
            id
        } = req.params;


        const result = await pool.query(
            `
            SELECT
                ve.id,

                TO_CHAR(
                    ve.visit_date,
                    'YYYY-MM-DD'
                ) AS visit_date,

                ve.visitor_name,
                ve.address,
                ve.mobile_number,
                ve.purpose_of_visit,
                ve.official_to_visit,
                ve.official_employee_id,
                ve.official_email,
                ve.approval_status,

                TO_CHAR(
                    ve.approval_time,
                    'DD-MM-YYYY HH12:MI AM'
                ) AS approval_time,

                ve.rejection_reason,
                ve.entry_status,

                TO_CHAR(
                    ve.time_in,
                    'HH12:MI AM'
                ) AS time_in,

                TO_CHAR(
                    ve.time_out,
                    'HH12:MI AM'
                ) AS time_out,

                ve.signature,
                ve.photo_path,
                ve.created_at,

                e.employee_name AS official_name,
                e.employee_code AS official_code,

                d.department_name

            FROM visitor_entries ve

            INNER JOIN employees e
                ON e.id =
                   ve.official_employee_id

            LEFT JOIN departments d
                ON d.id =
                   e.department_id

            WHERE ve.id = $1
              AND ve.official_employee_id = $2

            LIMIT 1
            `,
            [
                id,
                req.official.employeeId
            ]
        );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Visitor request not found."

            });

        }


        return res.status(200).json({

            success: true,

            visitor:
                result.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Get official visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load visitor request.",

            error:
                error.message

        });

    }

};


// =====================================================
// APPROVE VISITOR REQUEST
// =====================================================

const approveVisitor = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const result = await pool.query(
            `
            UPDATE visitor_entries

            SET
                approval_status =
                    'APPROVED',

                approval_time =
                    CURRENT_TIMESTAMP,

                rejection_reason =
                    NULL,

                entry_status =
                    'WAITING'

            WHERE id = $1
              AND official_employee_id = $2
              AND approval_status = 'PENDING'

            RETURNING
                id,
                visitor_name,
                official_employee_id,
                approval_status,
                approval_time,
                rejection_reason,
                entry_status
            `,
            [
                id,
                req.official.employeeId
            ]
        );


        if (
            result.rows.length === 0
        ) {

            const checkResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        approval_status
                    FROM visitor_entries
                    WHERE id = $1
                      AND official_employee_id = $2
                    `,
                    [
                        id,
                        req.official.employeeId
                    ]
                );


            if (
                checkResult.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Visitor request not found."

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    `This request is already ${checkResult.rows[0].approval_status.toLowerCase()}.`

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Visitor request approved successfully.",

            visitor:
                result.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Approve visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to approve visitor request.",

            error:
                error.message

        });

    }

};


// =====================================================
// REJECT VISITOR REQUEST
// =====================================================

const rejectVisitor = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const {
            rejection_reason
        } = req.body;


        if (
            !rejection_reason ||
            !rejection_reason.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Rejection reason is required."

            });

        }


        if (
            rejection_reason.trim().length > 500
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Rejection reason cannot exceed 500 characters."

            });

        }


        const result = await pool.query(
            `
            UPDATE visitor_entries

            SET
                approval_status =
                    'REJECTED',

                approval_time =
                    CURRENT_TIMESTAMP,

                rejection_reason =
                    $3,

                entry_status =
                    'WAITING'

            WHERE id = $1
              AND official_employee_id = $2
              AND approval_status = 'PENDING'

            RETURNING
                id,
                visitor_name,
                official_employee_id,
                approval_status,
                approval_time,
                rejection_reason,
                entry_status
            `,
            [
                id,
                req.official.employeeId,
                rejection_reason.trim()
            ]
        );


        if (
            result.rows.length === 0
        ) {

            const checkResult =
                await pool.query(
                    `
                    SELECT
                        id,
                        approval_status
                    FROM visitor_entries
                    WHERE id = $1
                      AND official_employee_id = $2
                    `,
                    [
                        id,
                        req.official.employeeId
                    ]
                );


            if (
                checkResult.rows.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Visitor request not found."

                });

            }


            return res.status(400).json({

                success: false,

                message:
                    `This request is already ${checkResult.rows[0].approval_status.toLowerCase()}.`

            });

        }


        return res.status(200).json({

            success: true,

            message:
                "Visitor request rejected successfully.",

            visitor:
                result.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Reject visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to reject visitor request.",

            error:
                error.message

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    loginOfficial,

    getCurrentOfficial,

    getOfficialVisitors,

    getOfficialVisitorById,

    approveVisitor,

    rejectVisitor

};