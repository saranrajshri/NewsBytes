const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  phoneNumber: Number,
  age:Number,
  password: String,
  topics : []
});

var user = mongoose.model("User", UserSchema);
module.exports = user;