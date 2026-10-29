const multer = require("multer");


// =====================================================
// STORAGE
// =====================================================

const storage =
    multer.memoryStorage();


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
