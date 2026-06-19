const { Joi, objectId, paginationQuery } = require("./commonValidators");

const bookParam = {
  params: Joi.object({
    bookId: objectId.required()
  })
};

const recordParam = {
  params: Joi.object({
    recordId: objectId.required()
  })
};

const borrowBook = {
  ...bookParam,
  body: Joi.object({
    memberId: objectId,
    dueDate: Joi.date().greater("now"),
    notes: Joi.string().max(300).allow("", null)
  })
};

const returnBook = {
  ...recordParam,
  body: Joi.object({
    notes: Joi.string().max(300).allow("", null)
  })
};

const historyQuery = {
  query: Joi.object({
    ...paginationQuery,
    status: Joi.string().valid("borrowed", "returned", "overdue")
  })
};

module.exports = {
  bookParam,
  recordParam,
  borrowBook,
  returnBook,
  historyQuery
};
