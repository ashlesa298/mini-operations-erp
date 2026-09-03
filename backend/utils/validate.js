const AppError = require("./AppError");

// Small reusable validators — kept dependency-free and explicit
const isPositiveInt = (val) => Number.isInteger(val) && val > 0;

const requireFields = (obj, fields) => {
  const missing = fields.filter((f) => obj[f] === undefined || obj[f] === null || obj[f] === "");
  if (missing.length) {
    throw new AppError(`Missing required field(s): ${missing.join(", ")}`, 400);
  }
};

const requirePositiveInt = (val, fieldName) => {
  if (!isPositiveInt(val)) {
    throw new AppError(`${fieldName} must be a positive integer.`, 400);
  }
};

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = { isPositiveInt, requireFields, requirePositiveInt, isValidEmail };