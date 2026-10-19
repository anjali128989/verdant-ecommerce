const Joi = require("joi");

const categories = [
  "Vases & Planters",
  "Cushions & Throws",
  "Lighting",
  "Wall Decor",
  "Table Decor",
];

const imageSchema = Joi.object({
  url: Joi.string().trim().uri({ scheme: ["http", "https"] }).required(),
  public_id: Joi.string().trim().min(1).required(),
}).unknown(false);

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),

  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150)
    .required(),

  description: Joi.string().trim().min(10).max(5000).required(),

  price: Joi.number().greater(0).required(),

  discountPrice: Joi.number()
    .greater(0)
    .less(Joi.ref("price"))
    .allow(null)
    .default(null),

  category: Joi.string()
    .valid(...categories)
    .required(),

  brand: Joi.string().trim().max(80).default("Botanical Home"),

  images: Joi.array().items(imageSchema).min(1).max(8).required(),

  stock: Joi.number().integer().min(0).required(),

  featured: Joi.boolean().default(false),

  isActive: Joi.boolean().default(true),
}).unknown(false);

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  slug: Joi.string()
    .trim()
    .lowercase()
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(150),
  description: Joi.string().trim().min(10).max(5000),
  price: Joi.number().greater(0),
  discountPrice: Joi.number().greater(0).allow(null),
  category: Joi.string().valid(...categories),
  brand: Joi.string().trim().max(80),
  images: Joi.array().items(imageSchema).min(1).max(8),
  stock: Joi.number().integer().min(0),
  featured: Joi.boolean(),
  isActive: Joi.boolean(),
})
  .min(1)
  .unknown(false);

module.exports = {
  categories,
  createProductSchema,
  updateProductSchema,
};