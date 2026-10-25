const cloudinary = require("../config/cloudinary");

const uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image to upload.",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "verdant/products",
          resource_type: "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (error, uploadedImage) => {
          if (error) {
            return reject(error);
          }

          resolve(uploadedImage);
        }
      );

      stream.end(req.file.buffer);
    });

    return res.status(201).json({
      success: true,
      message: "Product image uploaded successfully.",
      image: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
     console.error("Cloudinary upload diagnostic:", {
    message: error.message,
    http_code: error.http_code,
    name: error.name,
    requestId: error.request_id || error.requestId || null,
    errorResponse: error.error || null,
    response: error.response || null,
    stack: error.stack,
  });

    next(error);
  }
};

module.exports = { uploadProductImage };