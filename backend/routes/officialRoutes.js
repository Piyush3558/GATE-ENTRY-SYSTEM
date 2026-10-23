const express = require("express");

const router = express.Router();


// =====================================================
// CONTROLLER
// =====================================================

const {

    loginOfficial,

    getCurrentOfficial,

    getOfficialVisitors,

    getOfficialVisitorById,

    approveVisitor,

    rejectVisitor

} = require(
    "../controllers/officialController"
);


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

const officialAuth =
    require(
        "../middleware/officialAuth"
    );


// =====================================================
// OFFICIAL LOGIN
// PUBLIC ROUTE
// POST /api/official/login
// =====================================================

router.post(
    "/login",
    loginOfficial
);


// =====================================================
// VERIFY SESSION / CURRENT OFFICIAL
// PROTECTED ROUTE
// GET /api/official/me
// =====================================================

router.get(
    "/me",
    officialAuth,
    getCurrentOfficial
);


// =====================================================
// GET VISITORS ASSIGNED TO LOGGED-IN OFFICIAL
// PROTECTED ROUTE
//
// GET /api/official/visitors
// GET /api/official/visitors?status=PENDING
// GET /api/official/visitors?status=APPROVED
// GET /api/official/visitors?status=REJECTED
// =====================================================

router.get(
    "/visitors",
    officialAuth,
    getOfficialVisitors
);


// =====================================================
// APPROVE ASSIGNED VISITOR
// PROTECTED ROUTE
// PUT /api/official/visitors/:id/approve
// =====================================================

router.put(
    "/visitors/:id/approve",
    officialAuth,
    approveVisitor
);


// =====================================================
// REJECT ASSIGNED VISITOR
// PROTECTED ROUTE
// PUT /api/official/visitors/:id/reject
// =====================================================

router.put(
    "/visitors/:id/reject",
    officialAuth,
    rejectVisitor
);


// =====================================================
// GET ONE ASSIGNED VISITOR
// PROTECTED ROUTE
//
// Keep this after approve/reject routes.
// GET /api/official/visitors/:id
// =====================================================

router.get(
    "/visitors/:id",
    officialAuth,
    getOfficialVisitorById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;