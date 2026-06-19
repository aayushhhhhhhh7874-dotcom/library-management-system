const Notification = require("../models/Notification");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");

const getNotifications = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    sort,
    isRead
  } = req.query;

  const filter = {
    user: req.user._id
  };

  if (isRead !== undefined) {
    filter.isRead = isRead;
  }

  const skip = (page - 1) * limit;
  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate("relatedBorrowRecord")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Notification.countDocuments(filter)
  ]);

  res.status(200).json({
    status: "success",
    results: notifications.length,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    data: {
      notifications
    }
  });
});

const markAsRead = catchAsync(async (req, res, next) => {
  const notification = await Notification.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user._id
    },
    {
      isRead: true,
      readAt: new Date()
    },
    {
      new: true,
      runValidators: true
    }
  );

  if (!notification) {
    return next(new AppError("Notification not found.", 404));
  }

  return res.status(200).json({
    status: "success",
    data: {
      notification
    }
  });
});

module.exports = {
  getNotifications,
  markAsRead
};
