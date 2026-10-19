const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      minlength: [2, "Product name must be at least 2 characters"],
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },

    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug must contain lowercase letters, numbers, and hyphens only",
      ],
    },

    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0.01, "Price must be greater than zero"],
    },

    discountPrice: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          return value == null || value < this.price;
        },
        message: "Discount price must be lower than the regular price",
      },
    },

    category: {
      type: String,
      required: [true, "Product category is required"],
      enum: [
        "Vases & Planters",
        "Cushions & Throws",
        "Lighting",
        "Wall Decor",
        "Table Decor",
      ],
    },

    brand: {
      type: String,
      trim: true,
      default: "Botanical Home",
      maxlength: [80, "Brand cannot exceed 80 characters"],
    },

    images: {
      type: [
        {
          url: {
            type: String,
            required: true,
            trim: true,
          },
          public_id: {
            type: String,
            required: true,
            trim: true,
          },
        },
      ],
      validate: {
        validator: (images) => images.length >= 1 && images.length <= 8,
        message: "A product must have between 1 and 8 images",
      },
    },

    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
      default: 0,
    },

    ratings: {
      type: Number,
      default: 0,
      min: [0, "Ratings cannot be below zero"],
      max: [5, "Ratings cannot exceed five"],
    },

    numReviews: {
      type: Number,
      default: 0,
      min: [0, "Review count cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Review count must be a whole number",
      },
    },

    featured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ featured: 1, isActive: 1 });
productSchema.index({ name: "text", description: "text" });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;