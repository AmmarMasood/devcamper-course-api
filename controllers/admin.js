const errorResponse = require("../utils/errorResponse");
const User = require("../models/User");

// @desc Get all the users
// @route GET /api/v1/auth/users
// @access Private/Admin

exports.getUsers = (req, res, next) => {
  res.status(200).json(res.advancedResults);
};

// @desc Get a single user
// @route GET /api/v1/auth/users/:id
// @access Private/Admin

exports.getUser = (req, res, next) => {
  User.findById(req.params.id)
    .then(user => {
      if (!user) {
        return next(new errorResponse("Cant find the given id", 400));
      }
      res.status(200).json({ success: true, data: user });
    })
    .catch(err => next(err));
};

// @desc Create a user
// @route POST /api/v1/auth/userS
// @access Private/Admin

exports.createUser = (req, res, next) => {
  User.create(req.body)
    .then(user => res.status(200).json({ success: true, data: user }))
    .catch(err => next(err));
};

// @desc Update a user
// @route PUT /api/v1/auth/users/:id
// @access Private/Admin

exports.updateUser = (req, res, next) => {
  User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .then(user => res.status(200).json({ success: true, data: user }))
    .catch(err => next(err));
};
// @desc Delete a user
// @route DELETE /api/v1/auth/userS
// @access Private/Admin

exports.deleteUser = (req, res, next) => {
  User.findByIdAndDelete(req.params.id)
    .then(user => res.status(200).json({ success: true, data: {} }))
    .catch(err => next(err));
};
