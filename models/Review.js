const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please Add A Review Title"]
  },
  text: {
    type: String,
    required: [true, "Please add some text"]
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add rating between 1 and 10"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  bootcamp: {
    // in this way each review is realated to each bootcamp
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    require: true
  },
  user: {
    // in this way each review is realated to each user
    type: mongoose.Schema.ObjectId,
    ref: "User",
    require: true
  }
});

// so user can only add one review for each bootcamp
ReviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

// static method to getcourse ratings
ReviewSchema.statics.getAverageRating = async function(bootcampId) {
  console.log("Calculating Average...".bgRed);

  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampId }
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" }
      }
    }
  ]);
  // this model to get bootcamp model
  this.model("Bootcamp")
    .findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating
    })
    .catch(err => console.log(err));
};

// middle ware to calculate average rating of courses and add it in bootcamp
// calculates averate rating after saving the course
ReviewSchema.post("save", function() {
  this.constructor.getAverageRating(this.bootcamp);
});

// calculates average rating before removing the course
ReviewSchema.pre("remove", function() {
  this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", ReviewSchema);
