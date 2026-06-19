const express = require("express");
const borrowController = require("../controllers/borrowController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const borrowValidators = require("../validators/borrowValidators");

const router = express.Router();

router.use(protect);

router.get(
  "/history",
  validate(borrowValidators.historyQuery),
  borrowController.getBorrowingHistory
);
router.get(
  "/overdue",
  authorize(ROLES.LIBRARIAN),
  borrowController.getOverdueRecords
);
router.get(
  "/availability/:bookId",
  validate(borrowValidators.bookParam),
  borrowController.checkAvailability
);
router.post(
  "/:bookId",
  authorize(ROLES.MEMBER, ROLES.LIBRARIAN),
  validate(borrowValidators.borrowBook),
  borrowController.borrowBook
);
router.patch(
  "/return/:recordId",
  authorize(ROLES.MEMBER, ROLES.LIBRARIAN),
  validate(borrowValidators.returnBook),
  borrowController.returnBook
);

module.exports = router;
