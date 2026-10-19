
const express = require("express");
const { createOrder , getMyOrders,} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/my-orders", getMyOrders);
router.post("/", createOrder);

module.exports = router;
