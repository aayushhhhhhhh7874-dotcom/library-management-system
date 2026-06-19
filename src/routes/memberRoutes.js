const express = require("express");
const memberController = require("../controllers/memberController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const memberValidators = require("../validators/memberValidators");
const borrowValidators = require("../validators/borrowValidators");

const router = express.Router();

router.use(protect);

router.get(
  "/me/history",
  validate(borrowValidators.historyQuery),
  memberController.getMyBorrowHistory
);

router.use(authorize(ROLES.LIBRARIAN));

router.get("/", validate(memberValidators.listMembers), memberController.listMembers);
router.get("/:id", validate(memberValidators.memberIdParam), memberController.getMember);
router.patch(
  "/:id/status",
  validate(memberValidators.updateMemberStatus),
  memberController.updateMemberStatus
);
router.get(
  "/:id/history",
  validate({
    ...memberValidators.memberIdParam,
    query: borrowValidators.historyQuery.query
  }),
  memberController.getMemberBorrowHistory
);

module.exports = router;
