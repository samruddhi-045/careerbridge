// wraps async route handlers so errors go to next() instead of crashing the app
// (express doesn't catch errors thrown inside async functions on its own)
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;