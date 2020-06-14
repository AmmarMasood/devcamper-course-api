const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlength: [50, "Name can not be more than 50 characters"]
    },
    //  a slug is url friendly name for the bootcamp name we will create this using slugify package
    slug: String,
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [500, "Description can not be more than 500 characters"]
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS"
      ]
    },
    phone: {
      type: String,
      maxlength: [20, "Phone number can not be longer than 20 characters"]
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email"
      ]
    },
    address: {
      type: String,
      required: [true, "Please add an address"]
    },
    location: {
      // GeoJSON Point search for mongoose geojson to learn more about it
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number],
        index: "2dsphere"
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other"
      ]
    },
    // this wont be given, we will generate it
    averageRating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [10, "Rating must can not be more than 10"]
    },
    averageCost: Number,
    photo: {
      type: String,
      // if no photo we will display the default photo
      default: "no-photo.jpg"
    },
    housing: {
      type: Boolean,
      default: false
    },
    jobAssistance: {
      type: Boolean,
      default: false
    },
    jobGuarantee: {
      type: Boolean,
      default: false
    },
    acceptGi: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    user: {
      // in this way each bootcamp is realated to each user
      type: mongoose.Schema.ObjectId,
      ref: "User",
      require: true
    }
  },

  // this is a virtual we will use it to get courses related to bootcamp,
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// now we will use mongoose middlewares, we have many type of middle wares search for it in google. But rn we will discuss pre(which runs before the document is saved in database) and post(which run after).
BootcampSchema.pre("save", function(next) {
  // console.log(
  //   "Slugify ran",
  //   this.name,
  //   "=>",
  //   slugify(this.name, { lower: true })
  // );
  this.slug = slugify(this.name, { lower: true });
  next();
});
// geocode mapquest settings are done in utls/geocder.js, it will set the location in bootcamp schema
BootcampSchema.pre("save", function(next) {
  geocoder
    .geocode(this.address)
    .then(loc => {
      console.log(loc);
      this.location = {
        type: "Point",
        coordinates: [loc[0].longitude, loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country: loc[0].countryCode
      };
      next();
    })
    .catch(err => next(err));
});

// this is a mongoose middleware so if we delete some bootcamp all the courses related to that bootcamp will also be deleted
BootcampSchema.pre("remove", function(next) {
  this.model("Course")
    .deleteMany({ bootcamp: this._id })
    .then(res => {
      console.log("Courses removed from bootcamp " + this._id);
    })
    .catch(err => next(err));
  next();
});

// this is a virtual we will use it to get courses related to bootcamp, we will reverse populate with virtuals
// virtual will first accept the fields name we write courses it can be anything tho.2nd sonme options
BootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false
});

module.exports = mongoose.model("Bootcamp", BootcampSchema);
