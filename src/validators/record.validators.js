const Joi = require('joi');

exports.recordSchema = Joi.object({
  amount:      Joi.number().positive().precision(2).required()
                 .messages({ 'number.positive': 'Amount must be a positive number' }),
  type:        Joi.string().valid('income', 'expense').required(),
  category_id: Joi.number().integer().positive().required(),
  date:        Joi.date().iso().required(),
  notes:       Joi.string().max(500).allow('', null).optional()
});

exports.recordUpdateSchema = Joi.object({
  amount:      Joi.number().positive().precision(2)
                 .messages({ 'number.positive': 'Amount must be a positive number' }),
  type:        Joi.string().valid('income', 'expense'),
  category_id: Joi.number().integer().positive(),
  date:        Joi.date().iso(),
  notes:       Joi.string().max(500).allow('', null).optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update.' });