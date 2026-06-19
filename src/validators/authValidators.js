const { Joi } = require("./commonValidators");
const { ROLES } = require("../constants/roles");

const register = {
  body: Joi.object({
    name: Joi.string().min(2).max(80).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(...Object.values(ROLES)).default(ROLES.MEMBER),
    librarianInviteCode: Joi.string().max(100),
    phone: Joi.string().max(20).allow("", null),
    address: Joi.string().max(250).allow("", null),
    borrowLimit: Joi.number().integer().min(1).max(20)
  })
};

const login = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  })
};

const updateProfile = {
  body: Joi.object({
    name: Joi.string().min(2).max(80),
    phone: Joi.string().max(20).allow("", null),
    address: Joi.string().max(250).allow("", null)
  }).min(1)
};

module.exports = {
  register,
  login,
  updateProfile
};
