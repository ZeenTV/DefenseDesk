module.exports = (err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map((item) => item.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid ID format' });
  if (err.code === 11000) return res.status(400).json({ message: 'Duplicate value not allowed' });
  const status = err.statusCode || 500;
  return res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message });
};
