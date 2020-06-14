const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const colors = require("colors");
const fileupload = require("express-fileupload");
const errorHandler = require("./middlewares/error");
const cookieParser = require("cookie-parser");

//Load env vars
dotenv.config({ path: "./config/config.env" });

// connect to database
connectDB();

// route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");

const app = express();
// middleswares
// body parser
app.use(express.json());
// cookie parser
app.use(cookieParser());
// middleware for logging in dev
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// file uploading
app.use(fileupload());

// make the public/uploads folders  meaning that we can go to domainname/ what ever the image name is
app.use(express.static(path.join(__dirname, "public")));
// mount routes
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
// we gonne put this middleware here because we want this routes errors and because middlewares works in linear order
app.use(errorHandler);

const port = process.env.PORT || 5000;

const server = app.listen(port, () => {
  console.log(
    `Server is running on ${process.env.NODE_ENV} mode on the port ${port}`
      .rainbow
  );
});

// handles the unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Unhandeled Rejection: ${err.message}`.red.bold);
  // close the server and exit the process
  server.close(() => process.exit(1));
});
