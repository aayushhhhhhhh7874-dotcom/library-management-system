const Notification = require("../models/Notification");

const createNotification = async ({
  user,
  type,
  title,
  message,
  relatedBorrowRecord,
  dueDate
}) => {
  if (!user || !type || !title || !message) {
    return null;
  }

  return Notification.create({
    user,
    type,
    title,
    message,
    relatedBorrowRecord,
    dueDate
  });
};

module.exports = {
  createNotification
};
