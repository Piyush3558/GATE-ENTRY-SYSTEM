const express = require("express");

const router = express.Router();

const pool = require("../config/database");


// =====================================================
// GET ALL DEPARTMENTS
// =====================================================

router.get("/departments", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                department_name
            FROM departments
            ORDER BY department_name ASC
        `);

        res.json({
            success: true,
            departments: result.rows
        });

    }

    catch (error) {

        console.error(
            "Error loading departments:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to load departments",
            error: error.message
        });

    }

});


// =====================================================
// GET EMPLOYEES BY DEPARTMENT
// =====================================================

router.get(
    "/department/:departmentId",
    async (req, res) => {

        try {

            const { departmentId } = req.params;


            const result = await pool.query(
                `
                SELECT
                    id,
                    employee_name,
                    employee_code,
                    email,
                    unit,
                    department_id
                FROM employees
                WHERE department_id = $1
                ORDER BY employee_name ASC
                `,
                [departmentId]
            );


            res.json({

                success: true,

                employees: result.rows

            });

        }

        catch (error) {

            console.error(
                "Error loading employees:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to load employees",

                error:
                    error.message

            });

        }

    }
);

// =====================================================
// GET ALL EMPLOYEES
// =====================================================

router.get("/", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                employee_name,
                employee_code,
                email,
                unit,
                department_id
            FROM employees
            ORDER BY employee_name ASC
        `);

        res.json({

            success: true,

            employees: result.rows

        });

    }

    catch (error) {

        console.error(
            "Error loading all employees:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to load employees",

            error:
                error.message

        });

    }

});

module.exports = router;