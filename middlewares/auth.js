const jwt = require("jsonwebtoken");
const errorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// protect routes
exports.protect = async (req, res, next) => {
  let token;

  // so here we take the token given in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // sets token from bearer to header
    token = req.headers.authorization.split(" ")[1];
  }
  // sets token from cookie
  // we can also use cookies but for testing we will only use token.
  // if frontend sends cookie we use that eles token

  // else if(req.cookies.token){
  //   token = req.cookies.token
  // }

  // make sure that token exist
  if (!token) {
    return next(new errorResponse("Not authroize to access this route", 401));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DEC0DED " + decoded);
    req.user = await User.findById(decoded.id);

    console.log("USER " + req.user);
    next();
  } catch (err) {
    return next(new errorResponse("Not authroize to access this route", 401));
  }
};

// role protection
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new errorResponse(
          `User role ${req.user.role} is unauthorize to access this route`,
          401
        )
      );
    }
    next();
  };
};
