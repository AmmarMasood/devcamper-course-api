const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"]
  },
  email: {
    required: [true, "Email is required"],
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email"
    ],
    unique: true
  },
  role: {
    type: String,
    enum: ["user", "publisher", "admin"],
    default: "user"
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
    // its not gonna show the password when we are going to get the user
    select: false
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// encrypt the password in middleware
UserSchema.pre("save", async function(next) {
  // so when forgot password endpoint is called we make some token and save the user however this time we dont have the password so we just dont run this middleware:
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// assign jwt and return this is not a middlwware but a method THAT WE ADD INTO OUR MODEL SO WE CAN ACCESS IT IN CONTROLLER
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// checks if user entered passord is same as encrypted password stored in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// generate and hash password token(for forget pass)

UserSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString("hex");
  // hash the token and set to resetPasswordToken Field in model
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // set the expire
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", UserSchema);
