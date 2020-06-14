const errorResponse = require("../utils/errorResponse");
const User = require("../models/User");

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
