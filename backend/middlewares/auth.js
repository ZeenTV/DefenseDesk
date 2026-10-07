const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new AppError('Authentication required', 401);
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); } catch { throw new AppError('Invalid or expired session', 401); }
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError('Invalid or expired session', 401);
  if (user.mustChangePassword && !['/api/auth/me', '/api/auth/password', '/api/auth/logout'].includes(req.originalUrl.split('?')[0])) throw new AppError('Change your temporary password before continuing', 403);
  req.user = user;
  next();
});
const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.some((role) => req.user.type === role || req.user.roles?.includes(role))) return next(new AppError('You do not have permission to perform this action', 403));
  next();
};
module.exports = { protect, restrictTo };
