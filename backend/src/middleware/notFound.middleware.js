const ApiError = require('../utils/ApiError');

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.path} not found`));
};

module.exports = { notFound };
