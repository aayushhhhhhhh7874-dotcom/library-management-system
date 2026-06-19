const AppError = require("../utils/AppError");

const validate = (schemas) => (req, res, next) => {
  const targets = ["body", "params", "query"];

  for (const target of targets) {
    if (!schemas[target]) {
      continue;
    }

    const { error, value } = schemas[target].validate(req[target], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(" ");
      return next(new AppError(message, 400));
    }

    req[target] = value;
  }

  return next();
};

module.exports = validate;
