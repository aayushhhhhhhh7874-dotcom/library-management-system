const { Joi, objectId, paginationQuery } = require("./commonValidators");
const { MEMBERSHIP_STATUS } = require("../constants/roles");

const memberIdParam = {
  params: Joi.object({
    id: objectId.required()
  })
};

const listMembers = {
  query: Joi.object({
    ...paginationQuery,
    search: Joi.string().max(100),
    membershipStatus: Joi.string().valid(...Object.values(MEMBERSHIP_STATUS))
  })
};

const updateMemberStatus = {
  ...memberIdParam,
  body: Joi.object({
    membershipStatus: Joi.string()
      .valid(...Object.values(MEMBERSHIP_STATUS))
      .required(),
    borrowLimit: Joi.number().integer().min(1).max(20)
  })
};

module.exports = {
  memberIdParam,
  listMembers,
  updateMemberStatus
};
