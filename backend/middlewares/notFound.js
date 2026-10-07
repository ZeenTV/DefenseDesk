module.exports = (req, res, next) => next(Object.assign(new Error('Route not found'), { statusCode: 404 }));
