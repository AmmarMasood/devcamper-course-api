const express = require("express");
const {
  getUsers,
  getUser,
  updateUser,
  createUser,
  deleteUser
} = require("../controllers/admin");
const User = require("../models/User");
const { protect, authorize } = require("../middlewares/auth");
const advancedResults = require("../middlewares/advancedResults");

const router = express.Router();

// since all our routes will use authroize and protect we can use it like this

router.use(protect);
router.use(authorize("admin"));

router
  .route("/")
  .get(advancedResults(User), getUsers)
  .post(createUser);

router
  .route("/:id")
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
