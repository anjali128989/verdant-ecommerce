const express = require("express");

const {
  getProducts,
  getProductById,
} = require("../controllers/productController");

const router = express.Router();

// GET /api/products
router.get("/", getProducts);

// GET /api/products/:id or /api/products/:slug
router.get("/:id", getProductById);

module.exports = router;