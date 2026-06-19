const express = require("express");
const categoryController = require("../controllers/categoryController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const categoryValidators = require("../validators/categoryValidators");

const router = express.Router();

router.get("/", categoryController.getCategories);

router.use(protect, authorize(ROLES.LIBRARIAN));

router.post("/", validate(categoryValidators.createCategory), categoryController.createCategory);
router.patch("/:id", validate(categoryValidators.updateCategory), categoryController.updateCategory);
router.delete("/:id", validate(categoryValidators.categoryIdParam), categoryController.deleteCategory);

module.exports = router;
