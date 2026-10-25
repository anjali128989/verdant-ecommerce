const express = require("express");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
} = require("../controllers/orderController");

const {
  protect,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.get("/admin/all", adminOnly, getAllOrders);

router.get("/my-orders", getMyOrders);
router.post("/", createOrder);

// Admin-only order management
router.patch("/:orderId/status", adminOnly, updateOrderStatus);
router.post("/:orderId/payment", createRazorpayOrder);
router.post(
  "/:orderId/verify-payment",
  verifyRazorpayPayment
);
// Customer cancellation
router.delete("/:orderId", cancelOrder);



module.exports = router;