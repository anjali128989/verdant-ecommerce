const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required().messages({
    "string.empty": "Name is required",
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 60 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .lowercase()
    .max(254)
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(128)
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.max": "Password cannot exceed 128 characters",
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
}).unknown(false);

const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .lowercase()
    .max(254)
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(1)
    .max(128)
    .required()
    .messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
}).unknown(false);

module.exports = {
  registerSchema,
  loginSchema,
};
