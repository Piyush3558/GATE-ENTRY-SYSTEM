const express = require("express");

const router =
    express.Router();


// =====================================================
// AUTH CONTROLLER
// =====================================================

const {

    login,

    getCurrentUser

} = require(
    "../controllers/authController"
);


// =====================================================
// PASSWORD CONTROLLER
// =====================================================

const {

    changePassword

} = require(
    "../controllers/passwordController"
);


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const {

    authenticate

} = require(
    "../middleware/auth"
);


// =====================================================
// COMMON LOGIN
//
// POST /api/auth/login
//
// Security:
// {
//     "login_id": "security",
//     "password": "Security@123"
// }
//
// Official:
// {
//     "login_id": "amit.yadav@in.ufifilters.com",
//     "password": "Admin@123"
// }
//
// Admin:
// {
//     "login_id": "admin",
//     "password": "Admin@2026"
// }
// =====================================================

router.post(
    "/login",
    login
);


// =====================================================
// CURRENT LOGGED-IN USER
//
// GET /api/auth/me
//
// Requires:
// Authorization: Bearer <token>
// =====================================================

router.get(
    "/me",
    authenticate,
    getCurrentUser
);


// =====================================================
// CHANGE LOGGED-IN USER PASSWORD
//
// PUT /api/auth/change-password
//
// Available for:
// ADMIN
// SECURITY
// OFFICIAL
//
// Requires:
// Authorization: Bearer <token>
//
// Body:
// {
//     "current_password": "Welcome@123",
//     "new_password": "MyNew@123",
//     "confirm_password": "MyNew@123"
// }
// =====================================================

router.put(
    "/change-password",
    authenticate,
    changePassword
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;