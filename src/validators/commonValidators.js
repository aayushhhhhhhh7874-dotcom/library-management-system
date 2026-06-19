const Joi = require("joi");

const objectId = Joi.string()
  .pattern(/^[0-9a-fA-F]{24}$/)
  .message("must be a valid MongoDB ObjectId");

const paginationQuery = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().default("-createdAt")
};

module.exports = {
  Joi,
  objectId,
  paginationQuery
};
