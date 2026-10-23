const express = require("express");
const path = require("path");
const cors = require("cors");

require("dotenv").config();


// =====================================================
// DATABASE
// =====================================================

const pool =
    require("./config/database");


// =====================================================
// ROUTES
// =====================================================

const authRoutes =
    require("./routes/authRoutes");

const visitorRoutes =
    require("./routes/visitorRoutes");

const employeeRoutes =
    require("./routes/employeeRoutes");

const officialRoutes =
    require("./routes/officialRoutes");

const adminRoutes =
    require("./routes/adminRoutes");    

const adminAccessRoutes =
    require("./routes/adminAccessRoutes");

// =====================================================
// APPLICATION
// =====================================================

const app =
    express();


// =====================================================
// GLOBAL MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);


app.use(
    express.json({
        limit: "10mb"
    })
);


app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb"
    })
);


// =====================================================
// STATIC VISITOR UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);


// =====================================================
// HOME
// =====================================================

app.get(
    "/",
    (req, res) => {

        return res.status(200).json({

            success: true,

            message:
                "Gate Entry Management API is running"

        });

    }
);


// =====================================================
// DATABASE TEST
// =====================================================

app.get(
    "/api/test-db",
    async (req, res) => {

        try {

            const result =
                await pool.query(
                    `
                    SELECT
                        NOW() AS current_time
                    `
                );


            return res.status(200).json({

                success: true,

                message:
                    "PostgreSQL connection successful",

                database_time:
                    result.rows[0]
                        .current_time

            });

        }

        catch (error) {

            console.error(
                "Database test error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Database connection failed",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// COMMON AUTHENTICATION ROUTES
//
// POST /api/auth/login
// GET  /api/auth/me
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

// =====================================================
// ADMIN ROUTES
// =====================================================

app.use(
    "/api/admin",
    adminRoutes
);

// =====================================================
// ADMIN EMPLOYEE AND ACCOUNT MANAGEMENT
// =====================================================

app.use(
    "/api/admin/access",
    adminAccessRoutes
);

// =====================================================
// SECURITY VISITOR ROUTES
// =====================================================

app.use(
    "/api/visitors",
    visitorRoutes
);


// =====================================================
// EMPLOYEE MASTER ROUTES
// =====================================================

app.use(
    "/api/employees",
    employeeRoutes
);


// =====================================================
// OFFICIAL APPROVAL ROUTES
// =====================================================

app.use(
    "/api/official",
    officialRoutes
);




// =====================================================
// API ROUTE NOT FOUND
// =====================================================

app.use(
    "/api",
    (req, res) => {

        return res.status(404).json({

            success: false,

            message:
                `API route not found: ${req.method} ${req.originalUrl}`

        });

    }
);


// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Unhandled server error:",
            error
        );


        // =================================================
        // FILE SIZE ERROR
        // =================================================

        if (
            error.code ===
            "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Visitor photo cannot exceed 5 MB."

            });

        }


        // =================================================
        // INVALID FILE TYPE
        // =================================================

        if (
            error.message &&
            error.message.includes(
                "Only JPG"
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }


        // =================================================
        // GENERAL SERVER ERROR
        // =================================================

        return res.status(
            error.status || 500
        ).json({

            success: false,

            message:
                error.message ||
                "Internal server error."

        });

    }
);


// =====================================================
// SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "GATE ENTRY MANAGEMENT API"
        );
        console.log(
            "========================================"
        );
        console.log(
            `Server: http://localhost:${PORT}`
        );
        console.log(
            `Database test: http://localhost:${PORT}/api/test-db`
        );
        console.log(
            `Common login: http://localhost:${PORT}/api/auth/login`
        );
        console.log(
            "========================================"
        );
        console.log("");

    }
);