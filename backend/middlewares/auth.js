const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const ALLOWED_FORCE_PASSWORD_CHANGE_ROUTES = [
  '/api/auth/me',
  '/api/auth/password',
  '/api/auth/logout',
];

const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    throw new AppError('Authentication required', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired session', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new AppError('Invalid or expired session', 401);
  }

  const currentPath = req.originalUrl.split('?')[0];
  if (user.mustChangePassword && !ALLOWED_FORCE_PASSWORD_CHANGE_ROUTES.includes(currentPath)) {
    throw new AppError('Change your temporary password before continuing', 403);
  }

  req.user = user;
  next();
});

const restrictTo = (...roles) => (req, res, next) => {
  const hasPermission = roles.some(
    (role) => req.user.type === role || req.user.roles?.includes(role)
  );

  if (!hasPermission) {
    return next(new AppError('You do not have permission to perform this action', 403));
  }

  next();
};

module.exports = { protect, restrictTo };