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
    availability: Joi.string().valid("available", "unavailable"),
    semester: Joi.number().integer().min(1).max(8),
    subjectCode: Joi.string().max(20),
    course: Joi.string().max(80),
    sort: Joi.string()
      .valid("title", "-title", "publishedYear", "-publishedYear", "availableCopies", "-availableCopies", "-createdAt")
      .default("title")
  })
};

const createBook = {
  body: Joi.object({
    title: Joi.string().min(2).max(180).required(),
    isbn: Joi.string().min(3).max(40).required(),
    author: Joi.string().min(2).max(120).required(),
    category: objectId.required(),
    course: Joi.string().max(80).default("BTech CSE"),
    department: Joi.string().max(120).default("Computer Science and Engineering"),
    semester: Joi.number().integer().min(1).max(8),
    subjectCode: Joi.string().max(20),
    edition: Joi.string().max(40),
    publisher: Joi.string().max(120).allow("", null),
    publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()),
    language: Joi.string().max(40),
    totalCopies: Joi.number().integer().min(0).required(),
    availableCopies: Joi.number().integer().min(0),
    shelfLocation: Joi.string().max(60).allow("", null),
    description: Joi.string().max(1000).allow("", null),
    tags: Joi.array().items(Joi.string().max(40)).max(20)
  })
};

const updateBook = {
  ...bookIdParam,
  body: Joi.object({
    title: Joi.string().min(2).max(180),
    isbn: Joi.string().min(3).max(40),
    author: Joi.string().min(2).max(120),
    category: objectId,
    course: Joi.string().max(80),
    department: Joi.string().max(120),
    semester: Joi.number().integer().min(1).max(8),
    subjectCode: Joi.string().max(20),
    edition: Joi.string().max(40),
    publisher: Joi.string().max(120).allow("", null),
    publishedYear: Joi.number().integer().min(1000).max(new Date().getFullYear()),
    language: Joi.string().max(40),
    totalCopies: Joi.number().integer().min(0),
    availableCopies: Joi.number().integer().min(0),
    shelfLocation: Joi.string().max(60).allow("", null),
    description: Joi.string().max(1000).allow("", null),
    tags: Joi.array().items(Joi.string().max(40)).max(20)
  }).min(1)
};

module.exports = {
  bookIdParam,
  listBooks,
  createBook,
  updateBook
};
