const errorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
// @desc Register User
// @route POST /api/v1/auth/login
// @access Public

exports.register = (req, res, next) => {
  const { email, name, password, role } = req.body;

  // create User
  User.create({
    name,
    email,
    password,
    role
  })
    .then(user => {
      // create token
      // now this token can be used in frontend in localstorage however we will use cookies here, because its more seucre. We create function below called sendTokenResponse that does the res of the things.()Token is created in this function too.
      sendTokenResponse(user, 200, res);
    })
    .catch(err => next(err));
};

// @desc Login User
// @route POST /api/v1/auth/login
// @access Public

exports.login = (req, res, next) => {
  const { email, password } = req.body;

  // validate email and password
  if (!email || !password) {
    return next(new errorResponse("Please provided email and password", 400));
  }
  // check if user exist, since we did password select = false in models we wont get password in findOne so thats why we use .select(+password)
  User.findOne({ email: email })
    .select("+password")
    .then(user => {
      if (!user) {
        return next(
          new errorResponse(
            "Cant find the User with given email and password",
            400
          )
        );
      }
      // check is password is match
      user
        .matchPassword(password)
        .then(isMatch => {
          if (!isMatch) {
            return next(
              new errorResponse(
                "Cant find the User with given email and password",
                400
              )
            );
          }
          // create token

          // now this token can be used in frontend in localstorage however we will use cookies here, because its more seucre. We create function below called sendTokenResponse that does the res of the things.()Token is created in this function too.
          sendTokenResponse(user, 200, res);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// @desc Gets the current logged in User
// @route GET /api/v1/auth/me
// @access Private
exports.getMe = (req, res, next) => {
  User.findById(req.user.id).then(user =>
    res
      .status(200)
      .json({ success: true, data: user })
      .catch(err => next(err))
  );
};

// @desc Forget Password
// @route GET /api/v1/auth/forgotPassword
// @access Public
exports.forgotPassword = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then(user => {
      if (!user) {
        return next(
          new errorResponse(
            `Cant find the user with given ${req.body.email} email`,
            404
          )
        );
      }

      // Get a reset token from  look at model
      const resetToken = user.getResetPasswordToken();

      user.save({ validateBeforeSave: false });

      // here we send email:
      // createResetUrl
      const resetUrl = `${req.protocol}://${req.get(
        "host"
      )}/api/v1/auth/resetPassword/${resetToken}`;

      const message = `You have requested this email because you has requested reset of password. Please make a PUT request to: \n\n ${resetUrl}`;

      sendEmail({ email: user.email, subject: "Paswword reset token", message })
        .then(p => res.status(200).json({ success: true, data: "Email sent" }))
        .catch(err => {
          console.log(err);
          user.resetPasswordToken = undefined;
          user.resetPasswordExpire = undefined;
          user.save({ validateBeforeSave: false });
          return next(new errorResponse("Reset failed", 500));
        });

      // res.status(200).json({ success: true, data: user });
    })
    .catch(err => next(err));
};

// this is the route that takes in the reset token from the user
// @desc takes token for reset token route
// @route PUT /api/v1/auth/resetPassword/:resettoken
// @access Public
exports.resetPassword = (req, res, next) => {
  // get hashed token
  const resetPasswordToken = crypto
    .createHash(`sha256`)
    .update(req.params.resettoken)
    .digest("hex");
  User.findOne({
    resetPasswordToken: resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  })
    .then(user => {
      if (!user) {
        return next(new errorResponse(`Invalid token`, 404));
      }

      // set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      user.save();
      sendTokenResponse(user, 200, res);
    })
    .catch(err => next(err));
};

// @desc Update user details
// @route PUT /api/v1/auth/updateDetails
// @access Private
exports.updateDetails = (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };
  console.log("REQ.USER " + req.user.id);
  User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  })
    .then(user => res.status(200).json({ success: true, data: user }))
    .catch(err => next(err));
};

// @desc Update user password
// @route PUT /api/v1/auth/updatePassword
// @access Private
exports.updatePassword = async (req, res, next) => {
  User.findById(req.user.id)
    .select("+password")
    .then(user => {
      user
        .matchPassword(req.body.password)
        .then(match => {
          if (!match) {
            return next(new errorResponse("Password is incorrect"), 401);
          }

          user.password = req.body.newPassword;
          user.save();
          sendTokenResponse(user, 200, res);
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// @desc logout a user
// @route get /api/v1/auth/logout
// @access Private
exports.logout = async (req, res, next) => {
  // we remove the cookie from every request we send and make the cookie none and thamn set the xpitre date toi 10 secs
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, data: {} });
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();
  // options for cookie
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  // if we are in production we will be using https this why we do this:
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  // here we attach cookie in our response
  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({ success: true, token });
};
