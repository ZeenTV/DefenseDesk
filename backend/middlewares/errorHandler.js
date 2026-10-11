module.exports = (err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map((item) => item.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID Format' });
  if (err.code === 11000) return res.status(400).json({ message: 'Duplicated values are not allowed' });
  const status = err.statusCode || 500;
  return res.status(status).json({ message: status === 500 ? 'Internal Server Error' : err.message });
};
