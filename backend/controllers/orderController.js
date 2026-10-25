
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
const crypto = require("crypto");
const razorpay = require("../config/razorpay");
const { calculateOrderTotals } = require("../utils/orderHelpers");

const createOrder = async (req, res, next) => {
  let session;

  try {
    const { shippingAddress, paymentMethod } = req.body;

    if (
      !shippingAddress ||
      typeof shippingAddress !== "object" ||
      Array.isArray(shippingAddress)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid shipping address is required.",
      });
    }

    const requiredFields = [
      "fullName",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
    ];

    for (const field of requiredFields) {
      if (
        typeof shippingAddress[field] !== "string" ||
        !shippingAddress[field].trim()
      ) {
        return res.status(400).json({
          success: false,
          message: `${field} is required in the shipping address.`,
        });
      }
    }

    if (!["razorpay", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Payment method must be razorpay or cod.",
      });
    }

    session = await mongoose.startSession();

    let createdOrder;

    await session.withTransaction(async () => {
      const cart = await Cart.findOne({
        user: req.user._id,
      }).session(session);

      if (!cart || cart.items.length === 0) {
        const error = new Error("Your cart is empty.");
        error.statusCode = 400;
        throw error;
      }

      const orderItems = [];
      let subtotal = 0;

      for (const cartItem of cart.items) {
        const quantity = cartItem.quantity;

        if (!Number.isInteger(quantity) || quantity < 1) {
          const error = new Error("Invalid product quantity in cart.");
          error.statusCode = 400;
          throw error;
        }

        // Reserve stock atomically to prevent overselling.
        const product = await Product.findOneAndUpdate(
          {
            _id: cartItem.product,
            isActive: true,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
            runValidators: true,
          }
        );

        if (!product) {
          const error = new Error(
            "A product is unavailable or has insufficient stock."
          );
          error.statusCode = 409;
          throw error;
        }

        const unitPrice = product.discountPrice ?? product.price;
        const lineTotal = Math.round(unitPrice * quantity * 100) / 100;

        subtotal += lineTotal;

        orderItems.push({
          product: product._id,
          name: product.name,
          image: product.images?.[0]?.url ?? "",
          quantity,
          unitPrice,
          lineTotal,
        });
      }

      subtotal = Math.round(subtotal * 100) / 100;
      const totals = calculateOrderTotals(subtotal);

      const [order] = await Order.create(
        [
          {
            user: req.user._id,
            items: orderItems,
            shippingAddress: {
              fullName: shippingAddress.fullName.trim(),
              phone: shippingAddress.phone.trim(),
              addressLine1: shippingAddress.addressLine1.trim(),
              addressLine2: shippingAddress.addressLine2?.trim() ?? "",
              city: shippingAddress.city.trim(),
              state: shippingAddress.state.trim(),
              postalCode: shippingAddress.postalCode.trim(),
              country: shippingAddress.country?.trim() || "India",
            },
            ...totals,
            paymentMethod,
            paymentStatus: "pending",
            orderStatus: "Pending",
          },
        ],
        { session }
      );

      // Clear the cart in the same transaction.
      cart.items = [];
      await cart.save({ session });

      createdOrder = order;
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Payment is still pending.",
      order: createdOrder,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  let session;

  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    session = await mongoose.startSession();

    let cancelledOrder;

    await session.withTransaction(async () => {
      // Only the order owner can cancel the order.
      const order = await Order.findOne({
        _id: orderId,
        user: req.user._id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (order.orderStatus === "Cancelled") {
        const error = new Error(
          "This order has already been cancelled."
        );
        error.statusCode = 409;
        throw error;
      }

      if (["Shipped", "Delivered"].includes(order.orderStatus)) {
        const error = new Error(
          "Orders cannot be cancelled after shipping."
        );
        error.statusCode = 400;
        throw error;
      }

      // Paid orders require refund processing first.
      if (order.paymentStatus === "paid") {
        const error = new Error(
          "This paid order requires refund processing before cancellation."
        );
        error.statusCode = 409;
        throw error;
      }

      // Restore stock in the same transaction as cancellation.
      for (const item of order.items) {
        const product = await Product.findByIdAndUpdate(
          item.product,
          {
            $inc: { stock: item.quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!product) {
          const error = new Error(
            "A product from this order no longer exists. Contact support."
          );
          error.statusCode = 409;
          throw error;
        }
      }

      order.orderStatus = "Cancelled";
      order.cancelledAt = new Date();

      await order.save({ session });

      cancelledOrder = order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully. Stock has been restored.",
      order: cancelledOrder,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const allowedTransitions = {
      Pending: ["Processing"],
      Processing: ["Shipped"],
      Shipped: ["Delivered"],
      Delivered: [],
      Cancelled: [],
    };

    if (
      !orderStatus ||
      !Object.prototype.hasOwnProperty.call(
        allowedTransitions,
        orderStatus
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status. Use Pending, Processing, Shipped, Delivered, or Cancelled.",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Temporary diagnostic log to help verify the correct order.
    console.log("ADMIN STATUS UPDATE CHECK:", {
      orderId: order._id.toString(),
      requestedStatus: orderStatus,
      currentStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });

    // Unpaid Razorpay orders cannot enter fulfillment.
    // COD orders may proceed while payment is pending.
    const fulfilmentStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
    ];

    if (
      fulfilmentStatuses.includes(orderStatus) &&
      order.paymentMethod === "razorpay" &&
      order.paymentStatus !== "paid"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Razorpay payment must be completed before fulfilling this order.",
      });
    }

    if (!allowedTransitions[order.orderStatus]) {
      return res.status(400).json({
        success: false,
        message: "This order cannot be updated.",
      });
    }

    if (!allowedTransitions[order.orderStatus].includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change order status from ${order.orderStatus} to ${orderStatus}.`,
      });
    }

    order.orderStatus = orderStatus;

    if (orderStatus === "Delivered") {
      order.deliveredAt = new Date();
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${orderStatus}.`,
      order,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentMethod !== "razorpay") {
      return res.status(400).json({
        success: false,
        message: "This order does not use Razorpay.",
      });
    }

    if (
      order.paymentStatus !== "pending" ||
      order.orderStatus !== "Pending"
    ) {
      return res.status(409).json({
        success: false,
        message: "This order is not eligible for payment.",
      });
    }

    if (!Number.isFinite(order.total) || order.total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order total.",
      });
    }

    // Reuse an existing gateway order when available.
    if (order.paymentDetails?.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Razorpay order already exists.",
        razorpayOrderId: order.paymentDetails.razorpayOrderId,
        amount: Math.round(order.total * 100),
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    const amount = Math.round(order.total * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `rcpt_${order._id.toString()}`,
      notes: {
        storeOrderId: order._id.toString(),
        customerId: req.user._id.toString(),
      },
    });

    order.paymentDetails.razorpayOrderId = razorpayOrder.id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Razorpay payment order created successfully.",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", {
      message: error.message,
      statusCode: error.statusCode,
      error: error.error,
    });

    return next(error);
  }
};

const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    const {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store order ID.",
      });
    }

    if (
      typeof razorpayOrderId !== "string" ||
      typeof razorpayPaymentId !== "string" ||
      typeof razorpaySignature !== "string" ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return res.status(400).json({
        success: false,
        message: "All Razorpay payment fields are required.",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.paymentMethod !== "razorpay") {
      return res.status(400).json({
        success: false,
        message: "This order does not use Razorpay.",
      });
    }

    if (
      !order.paymentDetails?.razorpayOrderId ||
      order.paymentDetails.razorpayOrderId !== razorpayOrderId
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay order ID does not match.",
      });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(409).json({
        success: false,
        message: "Cancelled orders cannot be paid.",
      });
    }

    if (order.paymentStatus === "paid") {
      if (
        order.paymentDetails.razorpayPaymentId === razorpayPaymentId
      ) {
        return res.status(200).json({
          success: true,
          message: "Payment was already verified.",
          paymentStatus: order.paymentStatus,
        });
      }

      return res.status(409).json({
        success: false,
        message: "A different payment has already been recorded.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const receivedBuffer = Buffer.from(razorpaySignature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      receivedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature.",
      });
    }

    // Verify the payment directly with Razorpay.
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    if (
      payment.order_id !== razorpayOrderId ||
      payment.amount !== Math.round(order.total * 100) ||
      payment.currency !== "INR"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match the store order.",
      });
    }

    if (payment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message: "Payment has not been captured yet.",
        gatewayPaymentStatus: payment.status,
      });
    }

    // Atomically prevent duplicate payment verification.
    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: order._id,
        user: req.user._id,
        paymentStatus: "pending",
        orderStatus: { $ne: "Cancelled" },
        "paymentDetails.razorpayOrderId": razorpayOrderId,
      },
      {
        $set: {
          paymentStatus: "paid",
          "paymentDetails.razorpayPaymentId": razorpayPaymentId,
        },
      },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!updatedOrder) {
      const latestOrder = await Order.findById(order._id);

      if (
        latestOrder?.paymentStatus === "paid" &&
        latestOrder.paymentDetails.razorpayPaymentId === razorpayPaymentId
      ) {
        return res.status(200).json({
          success: true,
          message: "Payment was already verified.",
          paymentStatus: "paid",
        });
      }

      // Do not assign orderStatus here: it is not defined in this function.
      return res.status(409).json({
        success: false,
        message:
          "Order changed during payment verification. Please check your order status.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      paymentStatus: updatedOrder.paymentStatus,
      order: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
