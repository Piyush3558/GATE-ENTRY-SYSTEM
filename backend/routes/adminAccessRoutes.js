const express = require("express");

const {
    authenticate,
    requireAdmin
} = require("../middleware/auth");


const {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus
} = require(
    "../controllers/adminAccessController"
);


const {
    getAccounts,
    createOfficialAccount,
    createSecurityAccount,
    resetAccountPassword,
    updateAccountStatus,
    unlockAccount
} = require(
    "../controllers/adminAccountController"
);


const router = express.Router();


// =====================================================
// ADMIN AUTHENTICATION
// Every route below requires an ADMIN token.
// =====================================================

router.use(
    authenticate,
    requireAdmin
);


// =====================================================
// EMPLOYEE MANAGEMENT
// =====================================================


// GET ALL EMPLOYEES
//
// GET /api/admin/access/employees
//
// Filters:
// ?search=amit
// ?department_id=8
// ?status=ACTIVE
// ?account_status=CREATED
// ?page=1
// ?limit=20

router.get(
    "/employees",
    getEmployees
);


// CREATE EMPLOYEE
//
// POST /api/admin/access/employees

router.post(
    "/employees",
    createEmployee
);


// GET ONE EMPLOYEE
//
// GET /api/admin/access/employees/92

router.get(
    "/employees/:id",
    getEmployeeById
);


// UPDATE EMPLOYEE
//
// PUT /api/admin/access/employees/92

router.put(
    "/employees/:id",
    updateEmployee
);


// ACTIVATE OR DEACTIVATE EMPLOYEE
//
// PUT /api/admin/access/employees/92/status
//
// Body:
// {
//     "is_active": false
// }

router.put(
    "/employees/:id/status",
    updateEmployeeStatus
);


// =====================================================
// USER ACCOUNT MANAGEMENT
// =====================================================


// GET ALL OFFICIAL AND SECURITY ACCOUNTS
//
// GET /api/admin/access/accounts

router.get(
    "/accounts",
    getAccounts
);


// CREATE OFFICIAL ACCOUNT
//
// POST /api/admin/access/accounts/official
//
// Body:
// {
//     "employee_id": 55,
//     "temporary_password": "Welcome@123"
// }

router.post(
    "/accounts/official",
    createOfficialAccount
);


// CREATE SECURITY ACCOUNT
//
// POST /api/admin/access/accounts/security
//
// Body:
// {
//     "username": "security2",
//     "display_name": "Security Guard 2",
//     "temporary_password": "Security@456"
// }

router.post(
    "/accounts/security",
    createSecurityAccount
);


// RESET OFFICIAL OR SECURITY PASSWORD
//
// PUT /api/admin/access/accounts/official/1/reset-password
// PUT /api/admin/access/accounts/security/1/reset-password
//
// Body:
// {
//     "temporary_password": "Reset@123"
// }

router.put(
    "/accounts/:type/:id/reset-password",
    resetAccountPassword
);


// ACTIVATE OR DEACTIVATE ACCOUNT
//
// PUT /api/admin/access/accounts/official/1/status
// PUT /api/admin/access/accounts/security/1/status
//
// Body:
// {
//     "is_active": false
// }

router.put(
    "/accounts/:type/:id/status",
    updateAccountStatus
);


// UNLOCK ACCOUNT
//
// PUT /api/admin/access/accounts/official/1/unlock
// PUT /api/admin/access/accounts/security/1/unlock

router.put(
    "/accounts/:type/:id/unlock",
    unlockAccount
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;