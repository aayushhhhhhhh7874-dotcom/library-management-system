const User = require("../models/User");
const { ROLES } = require("../constants/roles");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const sendAuthResponse = (user, statusCode, res) => {
  const token = user.createJwt();

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user
    }
  });
};

const register = catchAsync(async (req, res, next) => {
  const payload = { ...req.body };

  if (payload.role === ROLES.LIBRARIAN) {
    const inviteCode = process.env.LIBRARIAN_INVITE_CODE || "library-admin-setup";

    if (payload.librarianInviteCode !== inviteCode) {
      return next(new AppError("Valid librarian invite code is required.", 403));
    }
  }

  delete payload.librarianInviteCode;

  const user = await User.create(payload);
  sendAuthResponse(user, 201, res);
});

const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  return sendAuthResponse(user, 200, res);
});

const getMe = catchAsync(async (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user
    }
  });
});

const updateMe = catchAsync(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save({ validateModifiedOnly: true });

  res.status(200).json({
    status: "success",
    data: {
      user: req.user
    }
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateMe
};
