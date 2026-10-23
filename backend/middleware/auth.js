const jwt = require("jsonwebtoken");


// =====================================================
// VERIFY COMMON LOGIN TOKEN
// =====================================================

const authenticate = (
    req,
    res,
    next
) => {

    try {

        const authorizationHeader =
            req.headers.authorization;


        // =================================================
        // CHECK AUTHORIZATION HEADER
        // =================================================

        if (
            !authorizationHeader ||
            !authorizationHeader.startsWith(
                "Bearer "
            )
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "AUTHENTICATION_REQUIRED",

                message:
                    "Please sign in to continue."

            });

        }


        // =================================================
        // EXTRACT TOKEN
        // =================================================

        const token =
            authorizationHeader
                .substring(7)
                .trim();


        if (!token) {

            return res.status(401).json({

                success: false,

                code:
                    "TOKEN_MISSING",

                message:
                    "Authentication token is missing."

            });

        }


        // =================================================
        // CHECK JWT CONFIGURATION
        // =================================================

        if (!process.env.JWT_SECRET) {

            console.error(
                "JWT_SECRET is not configured."
            );


            return res.status(500).json({

                success: false,

                code:
                    "AUTH_CONFIGURATION_ERROR",

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


        const role =
            decoded.role
                ?.toUpperCase();


        // =================================================
        // VALIDATE ROLE
        // =================================================

        if (
            role !== "ADMIN" &&
            role !== "SECURITY" &&
            role !== "OFFICIAL"
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "INVALID_TOKEN_ROLE",

                message:
                    "The login session has an invalid role."

            });

        }


        // =================================================
        // VALIDATE ADMIN TOKEN
        // =================================================

        if (
            role === "ADMIN" &&
            !decoded.adminAccountId
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "INVALID_ADMIN_TOKEN",

                message:
                    "Invalid Administrator login session."

            });

        }


        // =================================================
        // VALIDATE SECURITY TOKEN
        // =================================================

        if (
            role === "SECURITY" &&
            !decoded.securityAccountId
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "INVALID_SECURITY_TOKEN",

                message:
                    "Invalid Security login session."

            });

        }


        // =================================================
        // VALIDATE OFFICIAL TOKEN
        // =================================================

        if (
            role === "OFFICIAL" &&
            (
                !decoded.officialAccountId ||
                !decoded.employeeId
            )
        ) {

            return res.status(401).json({

                success: false,

                code:
                    "INVALID_OFFICIAL_TOKEN",

                message:
                    "Invalid Official login session."

            });

        }


        // =================================================
        // SAVE AUTHENTICATED USER
        // =================================================

        req.authUser = {

            role,

            adminAccountId:
                decoded.adminAccountId ||
                null,

            securityAccountId:
                decoded.securityAccountId ||
                null,

            officialAccountId:
                decoded.officialAccountId ||
                null,

            employeeId:
                decoded.employeeId ||
                null,

            username:
                decoded.username ||
                null,

            email:
                decoded.email ||
                null

        };


        next();

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );


        if (
            error.name ===
            "TokenExpiredError"
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


// =====================================================
// REQUIRE SPECIFIC ROLE
// =====================================================

const requireRole = (
    ...allowedRoles
) => {

    const normalizedRoles =
        allowedRoles.map(
            role =>
                role.toUpperCase()
        );


    return (
        req,
        res,
        next
    ) => {

        if (!req.authUser) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication is required."

            });

        }


        if (
            !normalizedRoles.includes(
                req.authUser.role
            )
        ) {

            return res.status(403).json({

                success: false,

                code:
                    "ACCESS_DENIED",

                message:
                    "You do not have permission to access this resource."

            });

        }


        next();

    };

};


// =====================================================
// ADMIN ONLY
// =====================================================

const requireAdmin =
    requireRole(
        "ADMIN"
    );


// =====================================================
// SECURITY ONLY
// =====================================================

const requireSecurity =
    requireRole(
        "SECURITY"
    );


// =====================================================
// OFFICIAL ONLY
// =====================================================

const requireOfficial =
    requireRole(
        "OFFICIAL"
    );


// =====================================================
// ADMIN OR SECURITY
// =====================================================

const requireAdminOrSecurity =
    requireRole(
        "ADMIN",
        "SECURITY"
    );


// =====================================================
// ANY AUTHENTICATED PORTAL USER
// =====================================================

const requireAnyUser =
    requireRole(
        "ADMIN",
        "SECURITY",
        "OFFICIAL"
    );


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

    authenticate,

    requireRole,

    requireAdmin,

    requireSecurity,

    requireOfficial,

    requireAdminOrSecurity,

    requireAnyUser

};