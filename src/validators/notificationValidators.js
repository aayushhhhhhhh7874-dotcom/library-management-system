const { Joi, objectId, paginationQuery } = require("./commonValidators");

const notificationIdParam = {
  params: Joi.object({
    id: objectId.required()
  })
};

const listNotifications = {
  query: Joi.object({
    ...paginationQuery,
    isRead: Joi.boolean()
  })
};

module.exports = {
  notificationIdParam,
  listNotifications
};
