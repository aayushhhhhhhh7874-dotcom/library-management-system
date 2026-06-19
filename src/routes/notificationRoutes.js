const express = require("express");
const notificationController = require("../controllers/notificationController");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const notificationValidators = require("../validators/notificationValidators");

const router = express.Router();

router.use(protect);

router.get(
  "/",
  validate(notificationValidators.listNotifications),
  notificationController.getNotifications
);
router.patch(
  "/:id/read",
  validate(notificationValidators.notificationIdParam),
  notificationController.markAsRead
);

module.exports = router;
