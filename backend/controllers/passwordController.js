const bcrypt = require("bcryptjs");

const pool = require("../config/database");


const PASSWORD_SALT_ROUNDS = 12;


// =====================================================
// PASSWORD VALIDATION
// =====================================================

const validatePassword = (password) => {

    if (!password) {
        return "New password is required.";
    }

    if (password.length < 8) {
        return "Password must contain at least 8 characters.";
    }

    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter.";
    }

    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter.";
    }

    if (!/[0-9]/.test(password)) {
        return "Password must contain at least one number.";
    }

    if (
        !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
            password
        )
    ) {
        return "Password must contain at least one special character.";
    }

    return null;

};


// =====================================================
// GET ACCOUNT CONFIGURATION
// =====================================================

const getAccountConfig = (authUser) => {

    if (authUser.role === "ADMIN") {

        return {
            tableName: "admin_accounts",
            accountId:
                authUser.adminAccountId,
            targetType:
                "ADMIN_ACCOUNT"
        };

    }


    if (authUser.role === "SECURITY") {

        return {
            tableName:
                "security_accounts",
            accountId:
                authUser.securityAccountId,
            targetType:
                "SECURITY_ACCOUNT"
        };

    }


    if (authUser.role === "OFFICIAL") {

        return {
            tableName:
                "official_accounts",
            accountId:
                authUser.officialAccountId,
            targetType:
                "OFFICIAL_ACCOUNT"
        };

    }


    return null;

};


// =====================================================
// CHANGE OWN PASSWORD
//
// PUT /api/auth/change-password
//
// Authorization: Bearer token
//
// Body:
// {
//     "current_password": "Welcome@123",
//     "new_password": "MyNew@123",
//     "confirm_password": "MyNew@123"
// }
// =====================================================

const changePassword = async (req, res) => {

    const client =
        await pool.connect();


    try {

        const currentPassword =
            String(
                req.body.current_password || ""
            );


        const newPassword =
            String(
                req.body.new_password || ""
            );


        const confirmPassword =
            String(
                req.body.confirm_password || ""
            );


        if (!currentPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "Current password is required."

            });

        }


        if (newPassword !== confirmPassword) {

            return res.status(400).json({

                success: false,

                message:
                    "New password and confirmation password do not match."

            });

        }


        const passwordError =
            validatePassword(newPassword);


        if (passwordError) {

            return res.status(400).json({

                success: false,

                message:
                    passwordError

            });

        }


        if (
            currentPassword === newPassword
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from the current password."

            });

        }


        const config =
            getAccountConfig(
                req.authUser
            );


        if (
            !config ||
            !config.accountId
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This account cannot change its password."

            });

        }


        await client.query("BEGIN");


        const accountResult =
            await client.query(
                `
                    SELECT
                        id,
                        password_hash,
                        is_active
                    FROM ${config.tableName}
                    WHERE id = $1
                    FOR UPDATE
                `,
                [config.accountId]
            );


        if (
            accountResult.rows.length === 0
        ) {

            await client.query("ROLLBACK");


            return res.status(404).json({

                success: false,

                message:
                    "User account not found."

            });

        }


        const account =
            accountResult.rows[0];


        if (!account.is_active) {

            await client.query("ROLLBACK");


            return res.status(403).json({

                success: false,

                message:
                    "This user account is inactive."

            });

        }


        const currentPasswordMatches =
            await bcrypt.compare(
                currentPassword,
                account.password_hash
            );


        if (!currentPasswordMatches) {

            await client.query("ROLLBACK");


            return res.status(401).json({

                success: false,

                message:
                    "Current password is incorrect."

            });

        }


        const sameAsCurrentPassword =
            await bcrypt.compare(
                newPassword,
                account.password_hash
            );


        if (sameAsCurrentPassword) {

            await client.query("ROLLBACK");


            return res.status(400).json({

                success: false,

                message:
                    "New password must be different from the current password."

            });

        }


        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                PASSWORD_SALT_ROUNDS
            );


        await client.query(
            `
                UPDATE ${config.tableName}
                SET
                    password_hash = $1,
                    must_change_password = false,
                    password_changed_at =
                        CURRENT_TIMESTAMP,
                    failed_login_attempts = 0,
                    locked_until = NULL,
                    updated_at =
                        CURRENT_TIMESTAMP
                WHERE id = $2
            `,
            [
                newPasswordHash,
                config.accountId
            ]
        );


        // Record an audit log when the
        // Administrator changes their password.

        if (
            req.authUser.role === "ADMIN"
        ) {

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
                    VALUES
                    (
                        $1,
                        'CHANGE_OWN_PASSWORD',
                        $2,
                        $3,
                        'Administrator changed their password.'
                    )
                `,
                [
                    req.authUser
                        .adminAccountId,

                    config.targetType,

                    config.accountId
                ]
            );

        }


        await client.query("COMMIT");


        res.json({

            success: true,

            message:
                "Password changed successfully. Please sign in again.",

            must_change_password:
                false,

            logout_required:
                true

        });

    }

    catch (error) {

        await client.query("ROLLBACK");


        console.error(
            "Change password error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Unable to change password.",

            error:
                error.message

        });

    }

    finally {

        client.release();

    }

};


module.exports = {

    changePassword

};