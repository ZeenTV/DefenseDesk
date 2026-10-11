module.exports = (req, res, next) => {
  const error = Object.assign(new Error('Route not found'), { statusCode: 404 });
  next(error);
};