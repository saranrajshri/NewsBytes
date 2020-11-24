const bycrypt = require("bcryptjs");
const createError = require("http-errors");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
const config = require("../../config/config.json")[
  process.env.NODE_ENV || "development"
];
dotenv.config();

let user = (module.exports = {});

// Models
const User = require("../../models/User");

const { asyncHandler } = require("../../middlewares/errorHandlers");

// Validators
const { userRegisterAuth } = require("../../validators/validation");
const { post } = require("..");

// Create a new user
user.add = asyncHandler(async (req, res, next) => {
  const { phoneNumber, password } = req.body;

  const userDataCopy = { ...req.body };
  if (userDataCopy.phoneNumber && userDataCopy.age) {
    userDataCopy.phoneNumber = userDataCopy.phoneNumber.toString();
    userDataCopy.age = userDataCopy.age.toString();
  }

  // Validate User Data
  const validateUser = await userRegisterAuth.validateAsync(userDataCopy);

  // Check user already exists or not
  const doesUserExists = await User.find({ phoneNumber: phoneNumber });

  if (doesUserExists.length !== 0)
    throw createError.Conflict("User Already Exists");

  // Hash Password
  bycrypt.genSalt(10, (err, salt) => {
    bycrypt.hash(password, salt, async (err, hashedPassword) => {
      if (err) throw err;
      req.body.password = hashedPassword;
      // Save the user
      const user = new User(req.body);
      const savedUser = await user.save();

      res.send(savedUser);
    });
  });
});

// User Login
user.login = asyncHandler(async (req, res, next) => {
  passport.authenticate("login", async (err, user, info) => {
    try {
      if (err || !user) {
        const err = createError(401, "Incorrect Credentials");
        return next(err);
      }

      req.login(user, { session: false }, async (err) => {
        if (err) next(err);

        const body = { _id: user._id, phoneNumber: user.phoneNumber };

        const token = jwt.sign({ user: body }, config.secret);

        let options = {
          maxAge: 1000 * 60 * 15, // would expire after 15 minutes
          httpOnly: false, // The cookie only accessible by the web server
          signed: true, // Indicates if the cookie should be signed
        };

        res.cookie("token", token, options);

        return res.json({ token });
      });
    } catch (err) {
      next(err);
    }
  })(req, res, next);
});

// User Logout
user.logout = asyncHandler(async (req, res, next) => {
  req.logout();
  res.send({ message: "Logged Out Successfully!" });
});

// Get Headlines
user.getHeadLines = asyncHandler(async (req, res, next) => {
  const fetchedNews = await axios.get(
    `${process.env.NEWS_API_ENDPOINT}/top-headlines?country=in&apiKey=${process.env.NEWS_API_KEY}`
  );
  res.json(fetchedNews.data);
});

// Get News
user.getNews = asyncHandler(async (req, res, next) => {
  const userID = req.user._id;

  const userDetails = await User.findOne({ _id: userID });
  const userLikedTopics = userDetails.topics;

  // Create the query string
  var queryString = "";
  if (queryString.length == 1) {
    queryString += userLikedTopics[0];
  } else {
    for (var i = 0; i < userLikedTopics.length - 1; i++) {
      queryString += userLikedTopics[i] + " OR ";
    }
    queryString += userLikedTopics[userLikedTopics.length - 1];
  }

  const url = `${process.env.NEWS_API_ENDPOINT}/everything?q=${queryString}&apiKey=${process.env.NEWS_API_KEY}`;

  // get news
  const fetchedNews = await axios.get(url);

  res.json(fetchedNews.data);
});
