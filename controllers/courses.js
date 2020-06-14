const errorResponse = require("../utils/errorResponse");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

// @desc Get all courses and get all courses for a certain route.
// @route GET /api/v1/courses
// @route GET /api/v1/bootcamps/:bootcampId/courses
// @access public

exports.getCourses = (req, res, next) => {
  if (req.params.bootcampId) {
    console.log("here");
    Course.find({ bootcamp: req.params.bootcampId })
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

// @desc Get all courses and get all courses for a certain route.
// @route GET /api/v1/courses/:id
// @access public

exports.getCourse = (req, res, next) => {
  Course.findById(req.params.id)
    .populate({ path: "bootcamp", select: "name description" })
    .then(course => {
      if (!course) {
        return next(
          new errorResponse(`Course not found with ID: ${req.params.id}`, 404)
        );
      }
      res.status(200).json({ success: true, data: course });
    })
    .catch(err => next(err));
};

// @desc Add a course
// @route POST /api/v1/bootcamps/:bootcamp/course
// @access private

exports.addCourse = (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId;
  // console.log(req.body);
  Bootcamp.findById(req.params.bootcampId)
    .then(bootcamp => {
      console.log(bootcamp);
      if (!bootcamp) {
        return new errorResponse(
          `Bootcamp not found with ID: ${req.params.id}`,
          404
        );
      }

      Course.create(req.body)
        .then(course => {
          res.status(200).json({ success: true, data: course });
        })
        .catch(err => next(err));
    })
    .catch(err => new errorResponse(`${err}`, 404));
};

// @desc Update a course
// @route UPDATE /api/v1/courseS/:ID
// @access private

exports.updateCourse = (req, res, next) => {
  Course.findById(req.params.id)
    .then(course => {
      // console.log(bootcamp);
      if (!course) {
        return new errorResponse(
          `Course not found with ID: ${req.params.id}`,
          404
        );
      }

      Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
        .then(course => {
          res.status(200).json({ success: true, data: course });
        })
        .catch(err => next(err));
    })
    .catch(err => next(err));
};
// @desc Delete a course
// @route DELETE /api/v1/courses/:ID
// @access private

exports.deleteCourse = (req, res, next) => {
  Course.findById(req.params.id)
    .then(course => {
      // console.log(bootcamp);
      if (!course) {
        return new errorResponse(
          `Course not found with ID: ${req.params.id}`,
          404
        );
      }

      // we dont want to use findByIdAndDelete because we want to trigger  middleware
      course.remove();
      res.status(200).json({
        success: true,
        data: {}
      });
    })
    .catch(err => next(err));
};
