const path = require("path");
const Bootcamp = require("../models/Bootcamp");
const errorResponse = require("../utils/errorResponse");
const geoCoder = require("../utils/geocoder");
// contains the method that will will be neading in routes

// this route is the version where we do all the filtering only im commenting it out because in the next we are adding select as well as filtering so i can use only fileting later
// @desc: get all bootcamps
// @route: GET api/v1/bootcamps
// @access: public
// exports.getBootcamps = (req, res, next) => {
// here we will use advance advance filtering if user pass queries like /?location=MA&housing=true we can get  these queries in object form in req.querym we can directly pass into find and it will work fine.
// now to do greater than equals to we get /someKeyValueInDatabase[lte]=1000 in  params from user
// in back we will get it something like this: {someKeyValueInDatabase: {lte: 1000}} but mongodb filter with something
// like this: {someKeyValueInDatabase: {$lte: 1000}} (search it on google) so we are going to convert it to this version.
// there are many other operations like lte such as gt,gte,lt,in look it up
// console.log(req.query);
// this will take care of all of our queries including in,gt,gte, lte, lt
// let queryStr = JSON.stringify(req.query);
// queryStr = queryStr.replace(/\b(gt|gte|lte|lt|in)\b/g, match => `$${match}`);
// console.log(queryStr);

//   Bootcamp.find(JSON.parse(queryStr))
//     .then(data => {
//       res.status(200).json({ success: true, data: data });
//     })
//     .catch(err => next(err));
// };

// in this version we will do the select + sorting + page + limit as well as filtering so we can if we just want name we can do select=name,description&sort etc
// @desc: get all bootcamps
// @route: GET api/v1/bootcamps
// @access: public
exports.getBootcamps = (req, res, next) => {
  // now since we used middle ware here (check the routes/bootcamp.js ) we have access to  res.advancedResult
  // console.log(res.advancedResults);
  res.status(200).json(res.advancedResults);
};

// @desc: get  bootcamp
// @route: GET api/v1/bootcamps/:id
// @access: public
exports.getBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then(data => {
      if (!data) {
        return next(
          new errorResponse(`Bootcamp not found with ID: ${req.params.id}`, 404)
        );
      } else {
        return res.status(200).json({ success: true, data: data });
      }
    })
    // now we are going to use moongose cutom error handling in the middleware instead of doing it like that in .catch
    // .catch(err => res.status(400).json({ success: false })), we are using custom middleware called errorResponse that we call in server.js and it watches the error type and give message according.
    .catch(err => next(err));
};

// @desc: create a new  bootcamp
// @route: POST api/v1/bootcamps/
// @access: private
exports.createBootcamp = (req, res, next) => {
  // console.log(req.body);
  // ADDING USE TO REQ.BODY
  req.body.user = req.user.id;

  // now we want the person with publisher to be able to create a 1 bootcamp only and if its admin it can create as many as they like: we take of that here
  // checkfor published bootcamp:
  Bootcamp.findOne({ user: req.user.id }).then(publishedBootcamp => {
    if (publishedBootcamp && req.user.role !== "admin") {
      return next(
        new errorResponse(
          `Publisher with id ${req.user.id} has already published a bootcamp`,
          400
        )
      );
    }
  });

  //  here we just add the coming data into databse, if there is something that is not in our model mongodb wont save it
  Bootcamp.create(req.body)
    .then(data => {
      res.status(201).json({ success: true, data: data });
    })
    .catch(err => next(err));
};

// @desc: update a bootcamp
// @route: PUT api/v1/bootcamps/:id
// @access: private
exports.updateBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then(data => {
      if (!data) {
        return next(
          new errorResponse(`Bootcamp not found with ID: ${req.params.id}`, 404)
        );
      }
      // make sure the person updating the bootcamp is the on that created it:
      if (req.user.id !== data.user.toString() && req.user.role !== "admin") {
        return next(
          new errorResponse(
            `User with id ${req.user.id} is not allow to access this route`,
            404
          )
        );
      }
      Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      })
        .then(d => res.status(200).json({ success: true, data: d }))
        .catch(err => next(err));
    })
    .catch(err => next(err));
};

// @desc: delte a   bootcamp
// @route: DELETE api/v1/bootcamps/:id
// @access: private
exports.deleteBootcamp = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then(data => {
      if (!data) {
        return next(
          new errorResponse(`Bootcamp not found with ID: ${req.params.id}`, 404)
        );
      }

      // make sure the person deleting the bootcamp is the on that created it:
      if (req.user.id !== data.user.toString() && req.user.role !== "admin") {
        return next(
          new errorResponse(
            `User with id ${req.user.id} is not allow to access this route`,
            404
          )
        );
      }

      // we dont want to use findByIdAndDelete because we cant to trigger that middleware that remove all courses related to bootcamp
      data.remove();
      res.status(200).json({
        success: true,
        data: data
      });
    })
    .catch(err => next(err));
};

// @desc: get  bootcamps within a radius
// @route: GET api/v1/bootcamps/radius/:zipcode/:distance
// @access: private
// this will show all the bootcamps nearby when user provide us with their location
exports.getBootcampsInRadius = async (req, res, next) => {
  //  here we will do mongo geospatial queries because we already have geoJASON data in our location
  try {
    const { zipcode, distance } = req.params;
    // Get lat/lng from geocoder
    const loc = await geoCoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;
    // cal radius using radians
    // divide distance by radius of earth
    // radius of earth is = 3,963 miles
    const radius = distance / 3963;
    Bootcamp.find({
      location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
    })
      .then(bootcamps => {
        res.status(200).json({
          success: true,
          count: bootcamps.length,
          data: bootcamps
        });
      })
      .catch(err => {
        res.status(400).json({ success: false, message: err });
      });
  } catch (err) {
    res.status(400).json({ success: false, message: err });
  }
};

// photo upload is created using express-fileupload we added that middleware in server.js
// @desc: upload a photo for the bootcamp
// @route: PUT api/v1/bootcamps/:id/photo
// @access: private
exports.bootcampPhotoUpload = (req, res, next) => {
  Bootcamp.findById(req.params.id)
    .then(data => {
      if (!data) {
        return next(
          new errorResponse(`Bootcamp not found with ID: ${req.params.id}`, 404)
        );
      }

      if (!req.files) {
        return next(new errorResponse(`Pelase upload a file`, 400));
      }
      const file = req.files.file;
      // console.log(req.files.file);
      // make sure that file is a image
      if (!file.mimetype.startsWith("image")) {
        return next(new errorResponse(`Please upload a image file`, 400));
      }

      // console.log(req.files);
      if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
          new errorResponse(
            `Please upload a image less than ${process.env.MAX_FILE_UPLOAD}`,
            400
          )
        );
      }
      // create a custon file name because we dont want to repeat file name
      // {path.parse(file.name).ext will give us the extension of the orignal photo
      file.name = `photo_$${data._id}${path.parse(file.name).ext}`;

      file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, err => {
        if (err) {
          console.log(err);
          return next(new errorResponse(`Problem with file upload`, 500));
        }
        Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name })
          .then(data => {
            res.status(200).json({ success: true, data: file.name });
          })
          .catch(err => next(err));
      });

      // console.log(file);
    })
    .catch(err => next(err));
};
