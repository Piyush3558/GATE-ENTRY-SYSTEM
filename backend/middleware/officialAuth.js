const jwt = require("jsonwebtoken");


// =====================================================
// OFFICIAL JWT AUTHENTICATION
// =====================================================

const officialAuth = (req, res, next) => {

    try {

        // =================================================
        // READ AUTHORIZATION HEADER
        // =================================================

        const authorizationHeader =
            req.headers.authorization;


        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Official authentication is required."

            });

        }


        // =================================================
        // EXTRACT TOKEN
        // =================================================

        const token =
            authorizationHeader.substring(
                7
            );


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is missing."

            });

        }


        // =================================================
        // CHECK JWT SECRET
        // =================================================

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


        // =================================================
        // VERIFY TOKEN
        // =================================================

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // =================================================
        // VALIDATE TOKEN CONTENT
        // =================================================

        if (
            !decoded.employeeId ||
            !decoded.officialAccountId
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid authentication token."

            });

        }


        // =================================================
        // STORE OFFICIAL INFORMATION
        // =================================================

        req.official = {

            officialAccountId:
                decoded.officialAccountId,

            employeeId:
                decoded.employeeId,

            email:
                decoded.email

        };


        next();

    }

    catch (error) {

        console.error(
            "Official authentication error:",
            error.message
        );


        if (
            error.name === "TokenExpiredError"
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "TOKEN_EXPIRED",

                message:
                    "Your login session has expired. Please sign in again."

            });

        }


        return res.status(401).json({

            success: false,

            code:
                "INVALID_TOKEN",

            message:
                "Your login session is invalid. Please sign in again."

        });

    }

};


module.exports = officialAuth;