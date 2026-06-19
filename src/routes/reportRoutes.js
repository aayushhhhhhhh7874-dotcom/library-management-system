const express = require("express");
const reportController = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");

const router = express.Router();

router.use(protect, authorize(ROLES.LIBRARIAN));

router.get("/most-borrowed-books", reportController.getMostBorrowedBooks);
router.get("/active-members", reportController.getActiveMembers);
router.get("/overdue-records", reportController.getOverdueReport);
router.get("/inventory-status", reportController.getInventoryStatus);

module.exports = router;
