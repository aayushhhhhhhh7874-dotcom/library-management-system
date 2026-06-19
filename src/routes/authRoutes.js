const express = require("express");
const authController = require("../controllers/authController");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/auth");
const authValidators = require("../validators/authValidators");

const router = express.Router();

router.post("/register", validate(authValidators.register), authController.register);
router.post("/login", validate(authValidators.login), authController.login);
router.get("/me", protect, authController.getMe);
router.patch("/me", protect, validate(authValidators.updateProfile), authController.updateMe);

module.exports = router;
