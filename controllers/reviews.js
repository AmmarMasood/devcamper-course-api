const errorResponse = require("../utils/errorResponse");
const Bootcamp = require("../models/Bootcamp");
const User = require("../models/Bootcamp");
const Review = require("../models/Review");

// @desc Get all reviews and get all reviews for a certain bootcamp.
// @route GET /api/v1/reviews
// @route GET /api/v1/bootcamps/:bootcampId/reviews
// @access public

exports.getReviews = (req, res, next) => {
  if (req.params.bootcampId) {
    console.log("here");
    Review.find({ bootcamp: req.params.bootcampId })
      .then(data =>
        res.status(200).json({ success: true, count: data.length, data: data })
      )
      .catch(err =>
        res
          .status(400)
          .json({ success: false, error: "Issue with provided bootcamp id" })
      );
  } else {
    res.status(200).json(res.advancedResults);
  }
};

// @desc Get a review with id
// @route GET /api/v1/reviews/:id
// @access public

exports.getReview = (req, res, next) => {
  Review.findById(req.params.id)
    .populate({
      path: "bootcamp",
      select: "name description"
    })
    .then(review => {
      if (!review) {
        return next(
          new errorResponse(`Cant find review with the id of ${req.params.id}`),
          400
        );
      }
      res.status(200).json({ success: true, data: review });
    })
    .catch(err => next(err));
};

// @desc add a review with
// @route POST /api/v1/bootcamps/:bootcampId/reviews
// @access PRIVATE

exports.addReview = (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  req.body.user = req.user.id;

  Bootcamp.findById(req.params.bootcampId)
    .then(bootcamp => {
      if (!bootcamp) {
        return next(
          new errorResponse(
            `Cant find bootcamp with id ${req.params.bootcampId}`,
            404
          )
        );
      }

      Review.create(req.body)
        .then(review => {
          res.status(200).json({ success: true, data: review });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// @desc update a review
// @route POST /api/v1/reviews/:id
// @access PRIVATE

exports.updateReview = (req, res, next) => {
  Review.findById(req.params.id)
    .then(review => {
      if (!review) {
        return next(
          new errorResponse(`Cant find the review the given id`, 404)
        );
      }

      // make sure that review belongs to logged in user id
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new errorResponse(`Not authorize to update review`, 404));
      }
      Review.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
        .then(review => res.status(200).json({ success: true, data: review }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// @desc delete a review
// @route DELETE /api/v1/reviews/:id
// @access PRIVATE

exports.deleteReview = (req, res, next) => {
  Review.findById(req.params.id)
    .then(review => {
      if (!review) {
        return next(
          new errorResponse(`Cant find the review the given id`, 404)
        );
      }

      // make sure that review belongs to logged in user id
      if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
        return next(new errorResponse(`Not authorize to delete review`, 404));
      }
      review
        .remove()
        .then(review => res.status(200).json({ success: true, data: {} }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
};
