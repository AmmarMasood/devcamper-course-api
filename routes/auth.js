const express = require("express");
const {
  register,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  updateDetails,
  updatePassword,
  logout
} = require("../controllers/auth");
const { protect } = require("../middlewares/auth");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", protect, getMe);
router.post("/forgotPassword", forgotPassword);
router.put("/resetPassword/:resettoken", resetPassword);
router.put("/updateDetails", protect, updateDetails);
router.put("/updatePassword", protect, updatePassword);
module.exports = router;