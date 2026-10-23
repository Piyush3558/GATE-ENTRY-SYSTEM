const pool = require("../config/database");


// =====================================================
// SHARED VISITOR SELECT
// =====================================================

const visitorSelect = `
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

        COALESCE(
    (
        SELECT
            JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id',
                    vgm.id,
                    'member_name',
                    vgm.member_name
                )
                ORDER BY vgm.id
            )
        FROM visitor_group_members vgm
        WHERE vgm.visitor_entry_id = ve.id
    ),
    '[]'::json
) AS group_members,

(
    SELECT COUNT(*)::integer
    FROM visitor_group_members vgm
    WHERE vgm.visitor_entry_id = ve.id
) AS group_member_count,

        e.employee_name AS official_name,
        e.employee_code AS official_code,

        d.department_name

    FROM visitor_entries ve

    LEFT JOIN employees e
        ON e.id =
           ve.official_employee_id

    LEFT JOIN departments d
        ON d.id =
           e.department_id
`;


// =====================================================
// CREATE VISITOR REQUEST
// =====================================================

const createVisitor = async (req, res) => {

    let client;


    try {

        const {
            visitor_name,
            address,
            mobile_number,
            purpose_of_visit,
            official_to_visit,
            official_employee_id,
            group_members
        } = req.body;


        // =================================================
        // PRIMARY VISITOR VALIDATION
        // =================================================

        if (
            !visitor_name ||
            !visitor_name.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor name is required."

            });

        }


        if (
            visitor_name.trim().length >
            150
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor name cannot exceed 150 characters."

            });

        }


        if (
            !mobile_number ||
            !String(
                mobile_number
            ).trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number is required."

            });

        }


        const cleanedMobileNumber =
            String(
                mobile_number
            )
                .trim();


        if (
            !/^\d{10}$/.test(
                cleanedMobileNumber
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number must contain exactly 10 digits."

            });

        }


        if (
            !purpose_of_visit ||
            !purpose_of_visit.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Purpose of visit is required."

            });

        }


        if (
            !official_to_visit ||
            !official_to_visit.trim()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Official to visit is required."

            });

        }


        const parsedEmployeeId =
            Number(
                official_employee_id
            );


        if (
            !Number.isInteger(
                parsedEmployeeId
            ) ||
            parsedEmployeeId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A valid official employee is required."

            });

        }


        // =================================================
        // PARSE TEAM MEMBERS
        // =================================================

        let parsedGroupMembers = [];


        if (
            group_members !== undefined &&
            group_members !== null &&
            group_members !== ""
        ) {

            try {

                parsedGroupMembers =
                    Array.isArray(
                        group_members
                    )
                        ? group_members
                        : JSON.parse(
                            group_members
                        );

            }

            catch (parseError) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Team-member information is invalid."

                });

            }

        }


        if (
            !Array.isArray(
                parsedGroupMembers
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Team members must be provided as a list."

            });

        }


        if (
            parsedGroupMembers.length >
            20
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A maximum of 20 accompanying members can be added."

            });

        }


        const cleanedGroupMembers =
            parsedGroupMembers.map(
                member => {

                    if (
                        typeof member ===
                        "string"
                    ) {

                        return member.trim();

                    }


                    if (
                        member &&
                        typeof member.member_name ===
                        "string"
                    ) {

                        return member
                            .member_name
                            .trim();

                    }


                    return "";

                }
            );


        if (
            cleanedGroupMembers.some(
                memberName =>
                    !memberName
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Every accompanying team member must have a name."

            });

        }


        if (
            cleanedGroupMembers.some(
                memberName =>
                    memberName.length > 150
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "A team-member name cannot exceed 150 characters."

            });

        }


        const normalizedGroupMembers =
            cleanedGroupMembers.map(
                memberName =>
                    memberName.toLowerCase()
            );


        if (
            new Set(
                normalizedGroupMembers
            ).size !==
            normalizedGroupMembers.length
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The same team member cannot be added more than once."

            });

        }


        if (
            normalizedGroupMembers.includes(
                visitor_name
                    .trim()
                    .toLowerCase()
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "The primary visitor cannot also be added as an accompanying member."

            });

        }


        // =================================================
        // PHOTO PATH
        // =================================================

        const photoPath =
            req.file
                ? `/uploads/visitors/${req.file.filename}`
                : null;


        // =================================================
        // DATABASE TRANSACTION
        // =================================================

        client =
            await pool.connect();


        await client.query(
            "BEGIN"
        );


        // =================================================
        // VERIFY SELECTED EMPLOYEE
        // =================================================

        const employeeResult =
            await client.query(
                `
                SELECT
                    id,
                    employee_name,
                    email,
                    is_active
                FROM employees
                WHERE id = $1
                LIMIT 1
                `,
                [
                    parsedEmployeeId
                ]
            );


        if (
            employeeResult.rows.length === 0
        ) {

            await client.query(
                "ROLLBACK"
            );


            return res.status(400).json({

                success: false,

                message:
                    "Selected employee was not found."

            });

        }


        const employee =
            employeeResult.rows[0];


        if (
            employee.is_active === false
        ) {

            await client.query(
                "ROLLBACK"
            );


            return res.status(400).json({

                success: false,

                message:
                    "The selected official is inactive."

            });

        }


        if (
            !employee.email ||
            !employee.email.trim() ||
            employee.email.trim() === "-"
        ) {

            await client.query(
                "ROLLBACK"
            );


            return res.status(400).json({

                success: false,

                message:
                    "The selected official does not have a valid email address."

            });

        }


        // =================================================
        // INSERT PRIMARY VISITOR
        // =================================================

        const insertResult =
            await client.query(
                `
                INSERT INTO visitor_entries
                (
                    visit_date,
                    visitor_name,
                    address,
                    mobile_number,
                    purpose_of_visit,
                    official_to_visit,
                    official_employee_id,
                    official_email,
                    approval_status,
                    approval_time,
                    rejection_reason,
                    entry_status,
                    time_in,
                    time_out,
                    photo_path
                )
                VALUES
                (
                    (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Asia/Kolkata'
                    )::date,

                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    'PENDING',
                    NULL,
                    NULL,
                    'WAITING',
                    NULL,
                    NULL,
                    $8
                )
                RETURNING id
                `,
                [
                    visitor_name.trim(),

                    address &&
                    address.trim()
                        ? address.trim()
                        : null,

                    cleanedMobileNumber,

                    purpose_of_visit.trim(),

                    employee.employee_name,

                    employee.id,

                    employee.email.trim(),

                    photoPath
                ]
            );


        const visitorId =
            insertResult.rows[0].id;


        // =================================================
        // INSERT ACCOMPANYING MEMBERS
        // =================================================

        for (
            const memberName
            of cleanedGroupMembers
        ) {

            await client.query(
                `
                INSERT INTO visitor_group_members
                (
                    visitor_entry_id,
                    member_name
                )
                VALUES
                (
                    $1,
                    $2
                )
                `,
                [
                    visitorId,
                    memberName
                ]
            );

        }


        await client.query(
            "COMMIT"
        );


        // =================================================
        // RETURN COMPLETE VISITOR
        // =================================================

        const visitorResult =
            await pool.query(
                `
                ${visitorSelect}
                WHERE ve.id = $1
                `,
                [
                    visitorId
                ]
            );


        return res.status(201).json({

            success: true,

            message:
                cleanedGroupMembers.length > 0
                    ? `Team visit request submitted successfully for ${cleanedGroupMembers.length + 1} visitors. Waiting for official approval.`
                    : "Visitor request submitted successfully. Waiting for official approval.",

            visitor:
                visitorResult.rows[0]

        });

    }

    catch (error) {

        if (client) {

            try {

                await client.query(
                    "ROLLBACK"
                );

            }

            catch (rollbackError) {

                console.error(
                    "Visitor transaction rollback error:",
                    rollbackError
                );

            }

        }


        console.error(
            "Create visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to create visitor request.",

            error:
                error.message

        });

    }

    finally {

        if (client) {

            client.release();

        }

    }

};


// =====================================================
// GET ALL VISITORS
// =====================================================

const getAllVisitors = async (req, res) => {

    try {

        const result =
            await pool.query(
                `
                ${visitorSelect}
                ORDER BY ve.id DESC
                `
            );


        return res.status(200).json({

            success: true,

            count:
                result.rows.length,

            visitors:
                result.rows

        });

    }

    catch (error) {

        console.error(
            "Get visitors error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch visitor entries.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET VISITOR BY ID
// =====================================================

const getVisitorById = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const result =
            await pool.query(
                `
                ${visitorSelect}
                WHERE ve.id = $1
                LIMIT 1
                `,
                [
                    id
                ]
            );


        if (
            result.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Visitor entry not found."

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
            "Get visitor by ID error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch visitor entry.",

            error:
                error.message

        });

    }

};


// =====================================================
// CHECK IN APPROVED VISITOR
// =====================================================

const checkInVisitor = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const checkResult =
            await pool.query(
                `
                SELECT
                    id,
                    visitor_name,
                    approval_status,
                    entry_status,
                    time_in,
                    time_out
                FROM visitor_entries
                WHERE id = $1
                LIMIT 1
                `,
                [
                    id
                ]
            );


        if (
            checkResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Visitor entry not found."

            });

        }


        const visitor =
            checkResult.rows[0];


        if (
            visitor.approval_status !==
            "APPROVED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor must be approved before check-in."

            });

        }


        if (
            visitor.entry_status ===
            "CHECKED_OUT" ||
            visitor.time_out !== null
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This visitor has already checked out."

            });

        }


        if (
            visitor.entry_status ===
            "INSIDE" ||
            visitor.time_in !== null
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This visitor is already checked in."

            });

        }


        const updateResult =
            await pool.query(
                `
                UPDATE visitor_entries

                SET
                    time_in = (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Asia/Kolkata'
                    )::time,

                    time_out = NULL,

                    entry_status = 'INSIDE'

                WHERE id = $1

                RETURNING id
                `,
                [
                    id
                ]
            );


        const visitorResult =
            await pool.query(
                `
                ${visitorSelect}
                WHERE ve.id = $1
                `,
                [
                    updateResult.rows[0].id
                ]
            );


        return res.status(200).json({

            success: true,

            message:
                "Visitor checked in successfully.",

            visitor:
                visitorResult.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Check-in visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to check in visitor.",

            error:
                error.message

        });

    }

};


// =====================================================
// CHECK OUT VISITOR
// =====================================================

const checkoutVisitor = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const checkResult =
            await pool.query(
                `
                SELECT
                    id,
                    visitor_name,
                    approval_status,
                    entry_status,
                    time_in,
                    time_out
                FROM visitor_entries
                WHERE id = $1
                LIMIT 1
                `,
                [
                    id
                ]
            );


        if (
            checkResult.rows.length === 0
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "Visitor entry not found."

            });

        }


        const visitor =
            checkResult.rows[0];


        if (
            visitor.approval_status !==
            "APPROVED"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor must be approved before checkout."

            });

        }


        if (
            visitor.time_out !== null ||
            visitor.entry_status ===
            "CHECKED_OUT"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor has already checked out."

            });

        }


        if (
            visitor.time_in === null ||
            visitor.entry_status !==
            "INSIDE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor must be checked in before checkout."

            });

        }


        const updateResult =
            await pool.query(
                `
                UPDATE visitor_entries

                SET
                    time_out = (
                        CURRENT_TIMESTAMP
                        AT TIME ZONE 'Asia/Kolkata'
                    )::time,

                    entry_status =
                        'CHECKED_OUT'

                WHERE id = $1

                RETURNING id
                `,
                [
                    id
                ]
            );


        const visitorResult =
            await pool.query(
                `
                ${visitorSelect}
                WHERE ve.id = $1
                `,
                [
                    updateResult.rows[0].id
                ]
            );


        return res.status(200).json({

            success: true,

            message:
                "Visitor checked out successfully.",

            visitor:
                visitorResult.rows[0]

        });

    }

    catch (error) {

        console.error(
            "Checkout visitor error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to checkout visitor.",

            error:
                error.message

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    createVisitor,

    getAllVisitors,

    getVisitorById,

    checkInVisitor,

    checkoutVisitor

};