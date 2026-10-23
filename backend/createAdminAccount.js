const bcrypt = require("bcryptjs");

const pool =
    require("./config/database");


// =====================================================
// INITIAL ADMIN DETAILS
// =====================================================

const username =
    "admin";

const password =
    "Admin@2026";

const displayName =
    "System Administrator";

const email =
    "amit.yadav@in.ufifilters.com";


// =====================================================
// CREATE OR UPDATE ADMIN ACCOUNT
// =====================================================

async function createAdminAccount() {

    try {

        console.log("");
        console.log(
            "Creating administrator account..."
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !username ||
            !username.trim()
        ) {

            throw new Error(
                "Administrator username is required."
            );

        }


        if (
            !password ||
            password.length < 8
        ) {

            throw new Error(
                "Administrator password must contain at least 8 characters."
            );

        }


        if (
            !displayName ||
            !displayName.trim()
        ) {

            throw new Error(
                "Administrator display name is required."
            );

        }


        const normalizedUsername =
            username
                .trim()
                .toLowerCase();


        const normalizedEmail =
            email && email.trim()
                ? email
                    .trim()
                    .toLowerCase()

                : null;


        // =================================================
        // HASH PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // =================================================
        // CHECK EXISTING ADMIN
        // =================================================

        const existingResult =
            await pool.query(
                `
                SELECT
                    id

                FROM admin_accounts

                WHERE LOWER(username) =
                      LOWER($1)

                LIMIT 1
                `,
                [
                    normalizedUsername
                ]
            );


        // =================================================
        // UPDATE EXISTING ADMIN
        // =================================================

        if (
            existingResult.rows.length > 0
        ) {

            await pool.query(
                `
                UPDATE admin_accounts

                SET
                    username = $1,
                    password_hash = $2,
                    display_name = $3,
                    email = $4,
                    is_active = TRUE,
                    must_change_password = TRUE,
                    password_changed_at = NULL,
                    failed_login_attempts = 0,
                    locked_until = NULL,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = $5
                `,
                [
                    normalizedUsername,
                    passwordHash,
                    displayName.trim(),
                    normalizedEmail,
                    existingResult.rows[0].id
                ]
            );


            console.log(
                "Administrator account updated successfully."
            );

        }

        // =================================================
        // CREATE NEW ADMIN
        // =================================================

        else {

            await pool.query(
                `
                INSERT INTO admin_accounts
                (
                    username,
                    password_hash,
                    display_name,
                    email,
                    is_active,
                    must_change_password,
                    failed_login_attempts
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    TRUE,
                    TRUE,
                    0
                )
                `,
                [
                    normalizedUsername,
                    passwordHash,
                    displayName.trim(),
                    normalizedEmail
                ]
            );


            console.log(
                "Administrator account created successfully."
            );

        }


        // =================================================
        // DISPLAY TEMPORARY LOGIN
        // =================================================

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "ADMIN PORTAL LOGIN"
        );
        console.log(
            "========================================"
        );
        console.log(
            `Username: ${normalizedUsername}`
        );
        console.log(
            `Temporary Password: ${password}`
        );
        console.log(
            `Display Name: ${displayName}`
        );
        console.log(
            `Email: ${normalizedEmail || "-"}`
        );
        console.log(
            "Role: ADMIN"
        );
        console.log(
            "========================================"
        );
        console.log("");
        console.log(
            "Change this temporary password before production use."
        );
        console.log("");

    }

    catch (error) {

        console.error(
            "Failed to create administrator account:",
            error.message
        );

        process.exitCode = 1;

    }

    finally {

        await pool.end();

    }

}


// =====================================================
// RUN
// =====================================================

createAdminAccount();