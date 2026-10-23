const express = require("express");

const router = express.Router();


// =====================================================
// CONTROLLER
// =====================================================

const {

    createVisitor,

    getAllVisitors,

    getVisitorById,

    checkInVisitor,

    checkoutVisitor

} = require(
    "../controllers/visitorController"
);


// =====================================================
// PHOTO UPLOAD MIDDLEWARE
// =====================================================

const upload =
    require(
        "../middleware/upload"
    );


// =====================================================
// CREATE VISITOR REQUEST
// POST /api/visitors
// =====================================================

router.post(
    "/",
    upload.single("photo"),
    createVisitor
);


// =====================================================
// GET ALL VISITORS
// GET /api/visitors
// =====================================================

router.get(
    "/",
    getAllVisitors
);


// =====================================================
// CHECK IN APPROVED VISITOR
// PUT /api/visitors/:id/check-in
// =====================================================

router.put(
    "/:id/check-in",
    checkInVisitor
);


// =====================================================
// CHECK OUT VISITOR
// PUT /api/visitors/:id/checkout
// =====================================================

router.put(
    "/:id/checkout",
    checkoutVisitor
);


// =====================================================
// GET VISITOR BY ID
//
// Keep this route after check-in and checkout.
// GET /api/visitors/:id
// =====================================================

router.get(
    "/:id",
    getVisitorById
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;