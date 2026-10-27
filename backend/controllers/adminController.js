const pool =
    require("../config/database");


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

        e.employee_name AS official_name,
        e.employee_code AS official_code,
        e.unit AS official_unit,

        d.id AS department_id,
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
// ADMIN DASHBOARD
// =====================================================

const getDashboard = async (
    req,
    res
) => {

    try {

        const summaryResult =
            await pool.query(
                `
                SELECT
                    COUNT(*)::integer
                        AS total_visitors,

                    COUNT(*) FILTER (
                        WHERE visit_date = (
                            CURRENT_TIMESTAMP
                            AT TIME ZONE 'Asia/Kolkata'
                        )::date
                    )::integer
                        AS today_visitors,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'PENDING'
                    )::integer
                        AS pending_approval,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'APPROVED'
                    )::integer
                        AS approved,

                    COUNT(*) FILTER (
                        WHERE approval_status =
                              'REJECTED'
                    )::integer
                        AS rejected,

                    COUNT(*) FILTER (
                        WHERE entry_status =
                              'WAITING'
                    )::integer
                        AS waiting,

                    COUNT(*) FILTER (
                        WHERE entry_status =
                              'INSIDE'
                    )::integer
                        AS currently_inside,

                    COUNT(*) FILTER (
                        WHERE entry_status =
                              'CHECKED_OUT'
                    )::integer
                        AS checked_out

                FROM visitor_entries
                `
            );


        const departmentResult =
            await pool.query(
                `
                SELECT
                    d.id AS department_id,
                    d.department_name,

                    COUNT(ve.id)::integer
                        AS total_visitors,

                    COUNT(ve.id) FILTER (
                        WHERE ve.approval_status =
                              'PENDING'
                    )::integer
                        AS pending,

                    COUNT(ve.id) FILTER (
                        WHERE ve.approval_status =
                              'APPROVED'
                    )::integer
                        AS approved,

                    COUNT(ve.id) FILTER (
                        WHERE ve.approval_status =
                              'REJECTED'
                    )::integer
                        AS rejected

                FROM departments d

                LEFT JOIN employees e
                    ON e.department_id =
                       d.id

                LEFT JOIN visitor_entries ve
                    ON ve.official_employee_id =
                       e.id

                GROUP BY
                    d.id,
                    d.department_name

                HAVING COUNT(ve.id) > 0

                ORDER BY
                    total_visitors DESC,
                    d.department_name ASC
                `
            );


        const recentVisitorsResult =
            await pool.query(
                `
                ${visitorSelect}

                ORDER BY
                    ve.id DESC

                LIMIT 10
                `
            );


        return res.status(200).json({

            success: true,

            summary:
                summaryResult.rows[0],

            department_summary:
                departmentResult.rows,

            recent_visitors:
                recentVisitorsResult.rows

        });

    }

    catch (error) {

        console.error(
            "Admin dashboard error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load Admin dashboard.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET ALL VISITORS FOR ADMIN
// =====================================================

const getVisitors = async (
    req,
    res
) => {

    try {

        const {
            search,
            from_date,
            to_date,
            approval_status,
            entry_status,
            department_id,
            official_employee_id,
            page = "1",
            limit = "50"
        } = req.query;


        const pageNumber =
            Math.max(
                1,
                Number.parseInt(
                    page,
                    10
                ) || 1
            );


        const limitNumber =
            Math.min(
                200,
                Math.max(
                    1,
                    Number.parseInt(
                        limit,
                        10
                    ) || 50
                )
            );


        const offset =
            (
                pageNumber - 1
            ) * limitNumber;


        const conditions = [];

        const values = [];


        const addValue = value => {

            values.push(value);

            return `$${values.length}`;

        };


        // =================================================
        // SEARCH
        // =================================================

        if (
            search &&
            search.trim()
        ) {

            const parameter =
                addValue(
                    `%${search.trim()}%`
                );


            conditions.push(
                `
                (
                    ve.visitor_name
                        ILIKE ${parameter}

                    OR ve.mobile_number
                        ILIKE ${parameter}

                    OR ve.address
                        ILIKE ${parameter}

                    OR ve.purpose_of_visit
                        ILIKE ${parameter}

                    OR ve.official_to_visit
                        ILIKE ${parameter}

                    OR ve.official_email
                        ILIKE ${parameter}

                    OR e.employee_code
                        ILIKE ${parameter}

                    OR d.department_name
                        ILIKE ${parameter}
                )
                `
            );

        }


        // =================================================
        // DATE RANGE
        // =================================================

        if (from_date) {

            conditions.push(
                `ve.visit_date >= ${addValue(
                    from_date
                )}`
            );

        }


        if (to_date) {

            conditions.push(
                `ve.visit_date <= ${addValue(
                    to_date
                )}`
            );

        }


        // =================================================
        // APPROVAL STATUS
        // =================================================

        if (
            approval_status &&
            approval_status.toUpperCase() !==
                "ALL"
        ) {

            const normalizedStatus =
                approval_status
                    .toUpperCase();


            if (
                ![
                    "PENDING",
                    "APPROVED",
                    "REJECTED"
                ].includes(
                    normalizedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid approval status."

                });

            }


            conditions.push(
                `ve.approval_status = ${addValue(
                    normalizedStatus
                )}`
            );

        }


        // =================================================
        // ENTRY STATUS
        // =================================================

        if (
            entry_status &&
            entry_status.toUpperCase() !==
                "ALL"
        ) {

            const normalizedStatus =
                entry_status
                    .toUpperCase();


            if (
                ![
                    "WAITING",
                    "INSIDE",
                    "CHECKED_OUT"
                ].includes(
                    normalizedStatus
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid entry status."

                });

            }


            conditions.push(
                `ve.entry_status = ${addValue(
                    normalizedStatus
                )}`
            );

        }


        // =================================================
        // DEPARTMENT
        // =================================================

        if (department_id) {

            conditions.push(
                `d.id = ${addValue(
                    department_id
                )}`
            );

        }


        // =================================================
        // OFFICIAL
        // =================================================

        if (official_employee_id) {

            conditions.push(
                `ve.official_employee_id = ${addValue(
                    official_employee_id
                )}`
            );

        }


        const whereClause =
            conditions.length > 0

                ? `WHERE ${conditions.join(
                    " AND "
                )}`

                : "";


        // =================================================
        // COUNT
        // =================================================

        const countResult =
            await pool.query(
                `
                SELECT
                    COUNT(*)::integer
                        AS total

                FROM visitor_entries ve

                LEFT JOIN employees e
                    ON e.id =
                       ve.official_employee_id

                LEFT JOIN departments d
                    ON d.id =
                       e.department_id

                ${whereClause}
                `,
                values
            );


        const totalRecords =
            countResult.rows[0].total;


        // =================================================
        // VISITOR DATA
        // =================================================

        const visitorValues = [
            ...values,
            limitNumber,
            offset
        ];


        const limitParameter =
            `$${visitorValues.length - 1}`;

        const offsetParameter =
            `$${visitorValues.length}`;


        const visitorResult =
            await pool.query(
                `
                ${visitorSelect}

                ${whereClause}

                ORDER BY
                    ve.id DESC

                LIMIT ${limitParameter}

                OFFSET ${offsetParameter}
                `,
                visitorValues
            );


        return res.status(200).json({

            success: true,

            count:
                visitorResult.rows.length,

            total:
                totalRecords,

            pagination: {

                page:
                    pageNumber,

                limit:
                    limitNumber,

                total_pages:
                    Math.max(
                        1,
                        Math.ceil(
                            totalRecords /
                            limitNumber
                        )
                    )

            },

            visitors:
                visitorResult.rows

        });

    }

    catch (error) {

        console.error(
            "Admin visitor list error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load visitor records.",

            error:
                error.message

        });

    }

};


// =====================================================
// GET ONE COMPLETE VISITOR RECORD
// =====================================================

const getVisitorById = async (
    req,
    res
) => {

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
                    "Visitor record not found."

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
            "Admin visitor detail error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load visitor details.",

            error:
                error.message

        });

    }

};


// =====================================================
// ADMIN FILTER OPTIONS
// =====================================================

const getFilterOptions = async (
    req,
    res
) => {

    try {

        const [
            departmentResult,
            officialResult
        ] = await Promise.all([

            pool.query(
                `
                SELECT
                    id,
                    department_name

                FROM departments

                ORDER BY
                    department_name ASC
                `
            ),

            pool.query(
                `
                SELECT
                    e.id,
                    e.employee_name,
                    e.employee_code,
                    e.email,
                    e.department_id,
                    d.department_name

                FROM employees e

                LEFT JOIN departments d
                    ON d.id =
                       e.department_id

                WHERE EXISTS (
                    SELECT 1
                    FROM visitor_entries ve
                    WHERE ve.official_employee_id =
                          e.id
                )

                ORDER BY
                    e.employee_name ASC
                `
            )

        ]);


        return res.status(200).json({

            success: true,

            departments:
                departmentResult.rows,

            officials:
                officialResult.rows

        });

    }

    catch (error) {

        console.error(
            "Admin filter options error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to load filter options.",

            error:
                error.message

        });

    }

};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    getDashboard,

    getVisitors,

    getVisitorById,

    getFilterOptions

};