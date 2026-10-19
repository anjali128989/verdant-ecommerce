const express = require("express");

const {
  getCart,
  addToCart,
    updateCartItem,
  removeCartItem,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// All cart routes require authentication.
router.use(protect);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);

module.exports = router;