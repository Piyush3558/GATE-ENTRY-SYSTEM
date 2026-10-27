const multer = require("multer");
const path = require("path");
const fs = require("fs");

// =====================================================
// UPLOAD DIRECTORY
// =====================================================

const uploadDirectory = path.join(
    __dirname,
    "..",
    "uploads",
    "visitors"
);


// =====================================================
// CREATE DIRECTORY IF NOT EXISTS
// =====================================================

if (!fs.existsSync(uploadDirectory)) {

    fs.mkdirSync(
        uploadDirectory,
        {
            recursive: true
        }
    );

}


// =====================================================
// STORAGE
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            uploadDirectory
        );

    },

    filename: function (req, file, cb) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();

        const filename =
            `visitor_${Date.now()}${extension}`;

        cb(
            null,
            filename
        );

    }

});


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = function (
    req,
    file,
    cb
) {

    console.log(
        "MULTER RECEIVED FILE:",
        {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        }
    );


    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        cb(
            null,
            true
        );

    }

    else {

        cb(
            new Error(
                "Only JPG, JPEG, PNG and WEBP images are allowed."
            ),
            false
        );

    }

};


// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        fileSize:
            5 * 1024 * 1024

    }

});


module.exports = upload;