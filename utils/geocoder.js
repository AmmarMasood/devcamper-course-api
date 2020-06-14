const nodeGeocoder = require("node-geocoder");

const options = {
  provider: process.env.GEOCODER_PROVIDER,

  // Optional depending on the providers
  httpAdapter: "https",
  apiKey: process.env.GEOCODE_API_KEY, // for Mapquest
  formatter: null // 'gpx', 'string', ...
};

const geocoder = nodeGeocoder(options);
module.exports = geocoder;
