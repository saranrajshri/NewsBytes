const Joi = require("@hapi/joi");

// User Validation
const userRegisterAuth = Joi.object({
  name: Joi.string().min(1).required(),
  phoneNumber: Joi.string().length(10).required(),
  age: Joi.string().min(1).required(),
  password: Joi.string().min(6).required(),
});


module.exports = {
  userRegisterAuth,
};