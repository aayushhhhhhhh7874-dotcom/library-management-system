const { Joi, objectId, paginationQuery } = require("./commonValidators");

const bookIdParam = {
  params: Joi.object({
    id: objectId.required()
  })
};

const listBooks = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100),
    category: Joi.string().max(80),
    author: Joi.string().max(80),
    availability: Joi.string().valid("available", "unavailable")
  })
};

const createBook = {
  body: Joi.object({
    title: Joi.string().min(2).max(180).required(),
    isbn: Joi.string().min(3).max(40).required(),
    author: Joi.string().min(2).max(120).required(),
    category: objectId.required(),
    publisher: Joi.string().max(120).allow("", null),
    publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()),
    language: Joi.string().max(40),
    totalCopies: Joi.number().integer().min(0).required(),
    availableCopies: Joi.number().integer().min(0),
    shelfLocation: Joi.string().max(60).allow("", null),
    description: Joi.string().max(1000).allow("", null)
  })
};

const updateBook = {
  ...bookIdParam,
  body: Joi.object({
    title: Joi.string().min(2).max(180),
    isbn: Joi.string().min(3).max(40),
    author: Joi.string().min(2).max(120),
    category: objectId,
    publisher: Joi.string().max(120).allow("", null),
    publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()),
    language: Joi.string().max(40),
    totalCopies: Joi.number().integer().min(0),
    availableCopies: Joi.number().integer().min(0),
    shelfLocation: Joi.string().max(60).allow("", null),
    description: Joi.string().max(1000).allow("", null)
  }).min(1)
};

module.exports = {
  bookIdParam,
  listBooks,
  createBook,
  updateBook
};
