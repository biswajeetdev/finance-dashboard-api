const Joi = require('joi');

exports.updateUserSchema = Joi.object({
  name:   Joi.string().min(2).max(100),
  role:   Joi.string().valid('viewer', 'analyst', 'admin'),
  status: Joi.string().valid('active', 'inactive')
}).min(1);