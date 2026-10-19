const mongoose = require("mongoose");
const Product = require("../models/Product");
const {
  createProductSchema,
  updateProductSchema,
} = require("../utils/productValidators");

// GET /api/products
// Supports search, category, price range, sorting and pagination.
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort = "newest",
      page = "1",
      limit = "12",
      featured,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 50.",
      });
    }

    const filter = { isActive: true };

    if (category) {
      const allowedCategories = Product.schema.path("category").enumValues;

      if (!allowedCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product category.",
        });
      }

      filter.category = category;
    }

    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const minimum = minPrice === undefined ? 0 : Number(minPrice);
      const maximum =
        maxPrice === undefined ? Number.MAX_SAFE_INTEGER : Number(maxPrice);

      if (
        !Number.isFinite(minimum) ||
        !Number.isFinite(maximum) ||
        minimum < 0 ||
        maximum < minimum
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid minimum and maximum price range.",
        });
      }

      filter.$expr = {
        $and: [
          {
            $gte: [
              { $ifNull: ["$discountPrice", "$price"] },
              minimum,
            ],
          },
          {
            $lte: [
              { $ifNull: ["$discountPrice", "$price"] },
              maximum,
            ],
          },
        ],
      };
    }

    if (featured !== undefined) {
      if (!["true", "false"].includes(featured)) {
        return res.status(400).json({
          success: false,
          message: "Featured must be true or false.",
        });
      }

      filter.featured = featured === "true";
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { effectivePrice: 1, _id: 1 },
      price_desc: { effectivePrice: -1, _id: 1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 },
    };

    if (!sortOptions[sort]) {
      return res.status(400).json({
        success: false,
        message: "Invalid sort option.",
      });
    }

    const skip = (pageNumber - 1) * limitNumber;

    let query = Product.find(filter).select("-__v");

    if (sort === "price_asc" || sort === "price_desc") {
      query = query
        .select({
          effectivePrice: {
            $ifNull: ["$discountPrice", "$price"],
          },
        })
        .sort(sortOptions[sort]);
    } else {
      query = query.sort(sortOptions[sort]);
    }

    const [products, totalProducts] = await Promise.all([
      query.skip(skip).limit(limitNumber).lean(),
      Product.countDocuments(filter),
    ]);

    // Avoid exposing the temporary sorting field in the response.
    const cleanedProducts = products.map(({ effectivePrice, ...product }) => ({
      ...product,
      price: product.price,
      discountPrice: product.discountPrice ?? null,
    }));

    return res.status(200).json({
      success: true,
      count: cleanedProducts.length,
      pagination: {
        totalProducts,
        currentPage: pageNumber,
        totalPages: Math.ceil(totalProducts / limitNumber),
        limit: limitNumber,
      },
      products: cleanedProducts,
    });
  } catch (error) {
    return next(error);
  }
};

// GET /api/products/:id
// Accepts either a MongoDB ID or a product slug.
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lookup = mongoose.isValidObjectId(id)
      ? { _id: id, isActive: true }
      : { slug: id, isActive: true };

    const product = await Product.findOne(lookup).select("-__v").lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      product: {
        ...product,
        discountPrice: product.discountPrice ?? null,
      },
    });
  } catch (error) {
    return next(error);
  }
};



// POST /api/products — Create a product (admin only)
const createProduct = async (req, res, next) => {
  try {
    const { error, value } = createProductSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Product validation failed.",
        errors: error.details.map((detail) => detail.message),
      });
    }

    const existingProduct = await Product.findOne({
      slug: value.slug,
    });

    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    const product = await Product.create(value);

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Product validation failed.",
        errors: Object.values(error.errors).map((item) => item.message),
      });
    }

    return next(error);
  }
};




const updateProduct = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const Product = require("../models/Product");
    const { updateProductSchema } = require("../utils/productValidators");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const { error, value } = updateProductSchema.validate(req.body, {
      abortEarly: false,
      convert: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((item) => item.message).join(" "),
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const effectivePrice = value.price ?? product.price;
    const effectiveDiscount =
      Object.prototype.hasOwnProperty.call(value, "discountPrice")
        ? value.discountPrice
        : product.discountPrice;

    if (
      effectiveDiscount != null &&
      effectiveDiscount >= effectivePrice
    ) {
      return res.status(400).json({
        success: false,
        message: "Discount price must be lower than the regular price.",
      });
    }

    Object.assign(product, value);
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A product with this slug already exists.",
      });
    }

    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const mongoose = require("mongoose");
    const Product = require("../models/Product");

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    product.isActive = false;
    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully.",
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
   updateProduct,
  deleteProduct,
};