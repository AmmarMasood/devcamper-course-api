const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const connectDB = require("./config/db");
const colors = require("colors");
const fileupload = require("express-fileupload");
const errorHandler = require("./middlewares/error");
const cookieParser = require("cookie-parser");
// for sql injections sefety
const mongoSanitize = require("express-mongo-sanitize");
// for extra security precausions
const helmet = require("helmet");
// to save from cross site script
const xss = require("xss-clean");
// limits the number of request a server can have
const expressRateLimit = require("express-rate-limit");
// prevents http params pollution
const hpp = require("hpp");
const cors = require("cors");

//Load env vars
dotenv.config({ path: "./config/config.env" });

// connect to database
connectDB();

// route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const reviews = require("./routes/reviews");
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

// sanitze data safety from sql injections
app.use(mongoSanitize());

// set security headers
app.use(helmet());

// prevents cross site script  ing
app.use(xss());

// rate limiting
const limiter = expressRateLimit({
  windowMs: 10 * 60 * 60 * 1000, //10 mins
  max: 100
});
app.use(limiter);

// hpp prevents http params pollution
app.use(hpp());

// enables cors
app.use(cors());

// make the public/uploads folders  meaning that we can go to domainname/ what ever the image name is
app.use(express.static(path.join(__dirname, "public")));
// mount routes
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", admin);
app.use("/api/v1/reviews", reviews);
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
