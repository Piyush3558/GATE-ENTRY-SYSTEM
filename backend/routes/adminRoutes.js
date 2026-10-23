const express = require("express");

const router =
    express.Router();


// =====================================================
// ADMIN CONTROLLER
// =====================================================

const {

    getDashboard,

    getVisitors,

    getVisitorById,

    getFilterOptions

} = require(
    "../controllers/adminController"
);


// =====================================================
// AUTHENTICATION
// =====================================================

const {

    authenticate,

    requireAdmin

} = require(
    "../middleware/auth"
);


// =====================================================
// PROTECT EVERY ADMIN ROUTE
// =====================================================

router.use(
    authenticate
);

router.use(
    requireAdmin
);


// =====================================================
// ADMIN DASHBOARD
//
// GET /api/admin/dashboard
// =====================================================

router.get(
    "/dashboard",
    getDashboard
);


// =====================================================
// ADMIN VISITOR FILTER OPTIONS
//
// GET /api/admin/visitors/filter-options
//
// Keep this before /visitors/:id.
// =====================================================

router.get(
    "/visitors/filter-options",
    getFilterOptions
);


// =====================================================
// ALL VISITOR RECORDS
//
// GET /api/admin/visitors
//
// Optional filters:
//
// ?search=rahul
// ?from_date=2026-08-01
// ?to_date=2026-08-31
// ?approval_status=APPROVED
// ?entry_status=INSIDE
// ?department_id=8
// ?official_employee_id=92
// ?page=1
// ?limit=50
// =====================================================

router.get(
    "/visitors",
    getVisitors
);


// =====================================================
// COMPLETE VISITOR DETAILS
//
// GET /api/admin/visitors/:id
// =====================================================

router.get(
    "/visitors/:id",
    getVisitorById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;