const express = require("express");
const bookController = require("../controllers/bookController");
const validate = require("../middleware/validate");
const { protect, authorize } = require("../middleware/auth");
const { ROLES } = require("../constants/roles");
const bookValidators = require("../validators/bookValidators");

const router = express.Router();

router.get("/", validate(bookValidators.listBooks), bookController.getBooks);
router.get("/:id", validate(bookValidators.bookIdParam), bookController.getBook);

router.use(protect, authorize(ROLES.LIBRARIAN));

router.post("/", validate(bookValidators.createBook), bookController.createBook);
router.patch("/:id", validate(bookValidators.updateBook), bookController.updateBook);
router.delete("/:id", validate(bookValidators.bookIdParam), bookController.deleteBook);

module.exports = router;
