const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please Add A Course Title"]
  },
  description: {
    type: String,
    required: [true, "Please add a description"]
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"]
  },
  tuition: {
    type: Number,
    required: [true, "Please dd a tuition cost"]
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"]
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  bootcamp: {
    // in this way each course is realated to each bootcamp
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    require: true
  },
  user: {
    // in this way each bootcamp is realated to each user
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: true
  }
});

// static method to getcourse tuitions
CourseSchema.statics.getAverageCost = async function(bootcampId) {
  console.log("Calculating Average...".bgBlue);

  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" }
      }
    }
  ]);
  // this model to get bootcamp model
  this.model("Bootcamp")
    .findByIdAndUpdate(bootcampId, {
      averageCost: Math.ceil(obj[0].averageCost / 10) * 10
    })
    .catch(err => console.log(err));
};

// middle ware to calculate average cost of courses and add it in bootcamp
// calculates averageCost after saving the course
CourseSchema.post("save", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

// calculates averageCost before removing the course
CourseSchema.pre("remove", function() {
  this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", CourseSchema);
