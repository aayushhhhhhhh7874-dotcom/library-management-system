const { Joi, objectId } = require("./commonValidators");

const categoryIdParam = {
  params: Joi.object({
    id: objectId.required()
  })
};

const createCategory = {
  body: Joi.object({
    name: Joi.string().min(2).max(80).required(),
    description: Joi.string().max(300).allow("", null)
  })
};

const updateCategory = {
  ...categoryIdParam,
  body: Joi.object({
    name: Joi.string().min(2).max(80),
    description: Joi.string().max(300).allow("", null)
  }).min(1)
};

module.exports = {
  categoryIdParam,
  createCategory,
  updateCategory
};
