const { v2: cloudinary } = require("cloudinary");


const configureCloudinary = () => {

    const {
        CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY,
        CLOUDINARY_API_SECRET
    } = process.env;


    if (
        !CLOUDINARY_CLOUD_NAME ||
        !CLOUDINARY_API_KEY ||
        !CLOUDINARY_API_SECRET
    ) {

        throw new Error(
            "Cloudinary environment variables are not configured."
        );

    }


    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });

};


const uploadVisitorPhoto = (file) => {

    configureCloudinary();


    return new Promise((resolve, reject) => {

        const uploadStream =
            cloudinary.uploader.upload_stream(
                {
                    folder:
                        "gate-entry-system/visitors",

                    resource_type:
                        "image",

                    unique_filename:
                        true,

                    overwrite:
                        false
                },
                (error, result) => {

                    if (error) {

                        reject(error);

                        return;

                    }


                    resolve({
                        secureUrl:
                            result.secure_url,

                        publicId:
                            result.public_id
                    });

                }
            );


        uploadStream.end(
            file.buffer
        );

    });

};


const deleteVisitorPhoto = async (
    publicId
) => {

    if (!publicId) {
        return;
    }


    configureCloudinary();


    await cloudinary.uploader.destroy(
        publicId,
        {
            resource_type:
                "image"
        }
    );

};


module.exports = {
    uploadVisitorPhoto,
    deleteVisitorPhoto
};
