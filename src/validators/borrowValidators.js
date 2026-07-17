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
    memberName: Joi.string().max(80).allow("", null),
    studentId: Joi.string().max(40).allow("", null),
    email: Joi.string().email().allow("", null),
    phone: Joi.string().max(20).allow("", null),
    semester: Joi.number().integer().min(1).max(8),
    enrollmentYear: Joi.number().integer().min(2000).max(new Date().getFullYear()),
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
