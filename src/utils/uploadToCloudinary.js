const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, folder = process.env.CLOUDINARY_FOLDER || "busnest") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

module.exports = uploadToCloudinary;