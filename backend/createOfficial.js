const bcrypt = require("bcryptjs");
const pool = require("./config/database");

async function createOfficial() {

    try {

        // =====================================================
        // CHANGE THESE ONLY IF REQUIRED
        // =====================================================

        const employeeId = 92;

        const email =
            "amit.yadav@in.ufifilters.com";

        const password =
            "Admin@123";


        // =====================================================
        // CHECK EMPLOYEE
        // =====================================================

        const employeeResult =
            await pool.query(
                `
                SELECT
                    id,
                    employee_name,
                    employee_code,
                    email
                FROM employees
                WHERE id = $1
                `,
                [employeeId]
            );


        if (
            employeeResult.rows.length === 0
        ) {

            console.log(
                "❌ Employee not found."
            );

            return;

        }


        const employee =
            employeeResult.rows[0];


        console.log(
            "Employee found:",
            employee.employee_name
        );


        // =====================================================
        // CHECK EXISTING ACCOUNT
        // =====================================================

        const existingAccount =
            await pool.query(
                `
                SELECT id
                FROM official_accounts
                WHERE employee_id = $1
                `,
                [employeeId]
            );


        // =====================================================
        // CREATE PASSWORD HASH
        // =====================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        // =====================================================
        // UPDATE EXISTING ACCOUNT
        // =====================================================

        if (
            existingAccount.rows.length > 0
        ) {

            await pool.query(
                `
                UPDATE official_accounts
                SET
                    email = $1,
                    password_hash = $2,
                    is_active = TRUE
                WHERE employee_id = $3
                `,
                [
                    email,
                    passwordHash,
                    employeeId
                ]
            );


            console.log(
                "✅ Official account updated."
            );

        }

        // =====================================================
        // CREATE NEW ACCOUNT
        // =====================================================

        else {

            await pool.query(
                `
                INSERT INTO official_accounts
                (
                    employee_id,
                    email,
                    password_hash,
                    is_active
                )
                VALUES
                ($1, $2, $3, TRUE)
                `,
                [
                    employeeId,
                    email,
                    passwordHash
                ]
            );


            console.log(
                "✅ Official account created."
            );

        }


        // =====================================================
        // DISPLAY LOGIN INFORMATION
        // =====================================================

        console.log("");
        console.log(
            "===================================="
        );
        console.log(
            "OFFICIAL LOGIN"
        );
        console.log(
            "===================================="
        );
        console.log(
            "Employee:",
            employee.employee_name
        );
        console.log(
            "Employee ID:",
            employeeId
        );
        console.log(
            "Email:",
            email
        );
        console.log(
            "Password:",
            password
        );
        console.log(
            "===================================="
        );


    }

    catch (error) {

        console.error(
            "❌ Error creating official:",
            error
        );

    }

    finally {

        await pool.end();

    }

}


createOfficial();