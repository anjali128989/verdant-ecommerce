const express = require("express");
const multer = require("multer");

const { protect, adminOnly } = require("../middleware/authMiddleware");
const { uploadProductImage } = require("../controllers/uploadController");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Only JPG, PNG, and WebP images are allowed.")
      );
    }

    callback(null, true);
  },
});

// POST /api/uploads/product-image
router.post(
  "/product-image",
  protect,
  adminOnly,
  upload.single("image"),
  uploadProductImage
);

module.exports = router;