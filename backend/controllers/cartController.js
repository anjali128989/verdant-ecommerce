
const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Always calculate prices using current database product data.
const getItemPrice = (product) =>
  product.discountPrice ?? product.price;

const getCartResponse = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  await cart.populate({
    path: "items.product",
    select: "name slug price discountPrice images stock category isActive",
  });

  const items = cart.items
    .filter((item) => item.product && item.product.isActive)
    .map((item) => {
      const product = item.product;
      const unitPrice = getItemPrice(product);

      return {
        _id: item._id,
        product: {
          _id: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          discountPrice: product.discountPrice ?? null,
          image: product.images?.[0]?.url ?? null,
          stock: product.stock,
          category: product.category,
        },
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    });

  return {
    _id: cart._id,
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + item.lineTotal, 0),
  };
};

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const cart = await getCartResponse(req.user._id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    return next(error);
  }
};

// POST /api/cart
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (
      typeof productId !== "string" ||
      !mongoose.isValidObjectId(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid productId is required.",
      });
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number between 1 and 99.",
      });
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.stock < 1) {
      return res.status(400).json({
        success: false,
        message: "This product is out of stock.",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    const requestedQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) are available.`,
      });
    }

    if (existingItem) {
      existingItem.quantity = requestedQuantity;
    } else {
      cart.items.push({ product: product._id, quantity });
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      cart: await getCartResponse(req.user._id),
    });
  } catch (error) {
    return next(error);
  }
};

// PUT /api/cart/:itemId
const updateCartItem = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    const { quantity } = req.body;

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a whole number between 1 and 99.",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    const product = await Product.findOne({
      _id: item.product,
      isActive: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product is no longer available.",
      });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} unit(s) are available.`,
      });
    }

    item.quantity = quantity;
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Cart quantity updated.",
      cart: await getCartResponse(req.user._id),
    });
  } catch (error) {
    return next(error);
  }
};

// DELETE /api/cart/:itemId
const removeCartItem = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cart item ID.",
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.id(req.params.itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    item.deleteOne();
    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart.",
      cart: await getCartResponse(req.user._id),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
};
