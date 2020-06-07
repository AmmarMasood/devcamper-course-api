const Bootcamp = require("../models/Bootcamp");
// contains the method that will will be neading in routes

// @desc: get all bootcamps
// @route: GET api/v1/bootcamps
// @access: public
exports.getBootcamps = (req, res, next) => {
  Bootcamp.find()
    .then(data => {
      res.status(200).json({ success: true, data: data });
    })
    .catch(err => {
      res.status(400).json({ success: false });
    });
};

// @desc: get  bootcamp
// @route: GET api/v1/bootcamps/:id
// @access: public
exports.getBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then(data => {
      if (!data) {
        res.status(400).json({ success: false });
      } else {
        return res.status(200).json({ success: true, data: data });
      }
    })
    // now we are going to use moongose cutom error handling in the middleware instead of doing it like that in .catch
    // .catch(err => res.status(400).json({ success: false }));
    .catch(err => next(err));
};

// @desc: create a new  bootcamp
// @route: POST api/v1/bootcamps/
// @access: private
exports.createBootcamp = (req, res, next) => {
  console.log(req.body);
  //  here we just add the coming data into databse, if there is something that is not in our model mongodb wont save it
  Bootcamp.create(req.body)
    .then(data => {
      res.status(201).json({ success: true, data: data });
    })
    .catch(err => {
      res.status(400).json({ success: false, err: err });
    });
};

// @desc: update a bootcamp
// @route: PUT api/v1/bootcamps/:id
// @access: private
exports.updateBootcamp = (req, res, next) => {
  Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).then(data => {
    if (!data) {
      return res.status(400).json({ success: false });
    } else {
      return res.status(200).json({ success: true, data: data });
    }
  });
};

// @desc: delte a   bootcamp
// @route: DELETE api/v1/bootcamps/:id
// @access: private
exports.deleteBootcamp = (req, res, next) => {
  Bootcamp.findByIdAndDelete(req.params.id)
    .then(data => {
      if (!data) {
        return res.status(400).json({
          success: false,
          err: "cannot find the bootcamp with given id"
        });
      }
      res.status(200).json({
        success: true,
        data: data
      });
    })
    .catch(err => {
      res.status(400).json({ success: false, err: err });
    });
};
