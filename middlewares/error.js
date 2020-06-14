const errorResponse = require("../utils/errorResponse");
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  // log to console for the developer
  console.log(err.name);
  // here we check for error name and give the message according to it
  // castError is when you dont find the id given by the user
  if (err.name === "CastError") {
    const message = `Resource not found with the given Id: ${err.value}`;
    error = new errorResponse(message, 404);
  }
  // checks error for duplicate keys, for e.g if the name of Bootcamp is unique mongoose will give this error if name repeats:
  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    error = new errorResponse(message, 400);
  }

  // checks error for required stuff for eg if the Bootcamps name is required but is not provided by the frontend we throw this error
  if (err.name === "ValidationError") {
    // all the messages coming from mongoose(that we made in schema) will be stored in err.errors so we dont need to make our own errors
    const message = Object.values(err.errors).map(val => val.message);
    error = new errorResponse(message, 400);
  }

  // check the error response claass in utils this is from where statusCode is coming from
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || "Server Error"
  });
};

module.exports = errorHandler;
