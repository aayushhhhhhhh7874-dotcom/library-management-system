const ROLES = Object.freeze({
  LIBRARIAN: "librarian",
  MEMBER: "member"
});

const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: "active",
  SUSPENDED: "suspended",
  EXPIRED: "expired"
});

const BORROW_STATUS = Object.freeze({
  BORROWED: "borrowed",
  RETURNED: "returned",
  OVERDUE: "overdue"
});

const NOTIFICATION_TYPES = Object.freeze({
  BORROW_CONFIRMATION: "borrow_confirmation",
  RETURN_REMINDER: "return_reminder",
  OVERDUE_ALERT: "overdue_alert",
  RETURN_CONFIRMATION: "return_confirmation"
});

module.exports = {
  ROLES,
  MEMBERSHIP_STATUS,
  BORROW_STATUS,
  NOTIFICATION_TYPES
};
