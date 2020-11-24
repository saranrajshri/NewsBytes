const express = require("express");
const router = express.Router();
const passport = require("passport");
// Routes
const user = require("./user/user");

const ensureAuthenticated = passport.authenticate("jwt", { session: false });

router
  .post("/user/add", user.add)
  .post("/user/login", user.login)
  .get("/user/headlines", user.getHeadLines)
  .get("/user/news", ensureAuthenticated, user.getNews);

module.exports = router;
