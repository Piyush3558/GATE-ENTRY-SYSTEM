const bcrypt = require("bcryptjs");

const pool =
    require("./config/database");


// =====================================================
// SECURITY ACCOUNT DETAILS
// =====================================================

const username =
    "security";

const password =
    "Security@123";

const displayName =
    "Security Guard";


// =====================================================
// CREATE OR UPDATE SECURITY ACCOUNT
// =====================================================

async function createSecurityAccount() {

    try {

        console.log("");
        console.log(
            "Creating security account..."
        );


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !username ||
            !username.trim()
        ) {

            throw new Error(
                "Security username is required."
            );

        }


        if (
            !password ||
            password.length < 8
        ) {

            throw new Error(
                "Security password must contain at least 8 characters."
            );

        }


        if (
            !displayName ||
            !displayName.trim()
        ) {

            throw new Error(
                "Security display name is required."
            );

        }


        const normalizedUsername =
            username
                .trim()
                .toLowerCase();


        // =================================================
        // HASH PASSWORD
        // =================================================

        const passwordHash =
            await bcrypt.hash(
                password,
                12
            );


        // =================================================
        // CHECK EXISTING ACCOUNT
        // =================================================

        const existingResult =
            await pool.query(
                `
                SELECT
                    id
                FROM security_accounts
                WHERE LOWER(username) =
                      LOWER($1)
                LIMIT 1
                `,
                [
                    normalizedUsername
                ]
            );


        // =================================================
        // UPDATE EXISTING ACCOUNT
        // =================================================

        if (
            existingResult.rows.length > 0
        ) {

            await pool.query(
                `
                UPDATE security_accounts

                SET
                    username = $1,
                    password_hash = $2,
                    display_name = $3,
                    is_active = TRUE,
                    updated_at =
                        CURRENT_TIMESTAMP

                WHERE id = $4
                `,
                [
                    normalizedUsername,
                    passwordHash,
                    displayName.trim(),
                    existingResult.rows[0].id
                ]
            );


            console.log(
                "Security account updated successfully."
            );

        }

        // =================================================
        // CREATE NEW ACCOUNT
        // =================================================

        else {

            await pool.query(
                `
                INSERT INTO security_accounts
                (
                    username,
                    password_hash,
                    display_name,
                    is_active
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    TRUE
                )
                `,
                [
                    normalizedUsername,
                    passwordHash,
                    displayName.trim()
                ]
            );


            console.log(
                "Security account created successfully."
            );

        }


        // =================================================
        // DISPLAY LOGIN INFORMATION
        // =================================================

        console.log("");
        console.log(
            "========================================"
        );
        console.log(
            "SECURITY PORTAL LOGIN"
        );
        console.log(
            "========================================"
        );
        console.log(
            `Username: ${normalizedUsername}`
        );
        console.log(
            `Password: ${password}`
        );
        console.log(
            `Display Name: ${displayName}`
        );
        console.log(
            "Role: SECURITY"
        );
        console.log(
            "========================================"
        );
        console.log("");

    }

    catch (error) {

        console.error(
            "Failed to create security account:",
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

createSecurityAccount();