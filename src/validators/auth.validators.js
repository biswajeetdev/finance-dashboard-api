const Joi = require('joi');

exports.registerSchema = Joi.object({
  name:     Joi.string().min(2).max(100).required()
              .messages({ 'string.empty': 'Name is required' }),
  email:    Joi.string().email().required()
              .messages({ 'string.email': 'Please provide a valid email' }),
  password: Joi.string().min(8).required()
              .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
              .messages({
                'string.pattern.base': 'Password must have uppercase, lowercase and a number'
              }),
  role:     Joi.string().valid('viewer', 'analyst', 'admin').default('viewer')
});

exports.loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required()
});