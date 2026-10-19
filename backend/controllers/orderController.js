
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");
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

        // Atomically reserve stock so concurrent orders cannot
        // purchase more units than are available.
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
        const lineTotal =
          Math.round(unitPrice * quantity * 100) / 100;

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
              addressLine2:
                shippingAddress.addressLine2?.trim() ?? "",
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

      // Clear the cart in the same transaction as the stock updates
      // and order creation.
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

module.exports = { createOrder };
