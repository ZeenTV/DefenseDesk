const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const publicUser = (user) => ({ _id: user._id, name: user.name, email: user.email, type: user.type, roles: user.roles || [], mustChangePassword: user.mustChangePassword });

exports.login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw new AppError('Email and password are required', 400);
    const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
    if (!user || !user.isActive || !(await user.comparePassword(password))) throw new AppError('Invalid email or password', 401);
    generateToken(user, res);
    res.status(200).json({ user: publicUser(user) });
  } catch (error) {
    console.error('LOGIN ERROR DETAILS:', error);
    res.status(error.statusCode || 500).json({ error: error.message, stack: error.stack });
  }
});

exports.logout = asyncHandler(async (req, res) => { res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); res.status(200).json({ message: 'Logged out' }); });
exports.me = asyncHandler(async (req, res) => { res.status(200).json({ user: publicUser(req.user) }); });
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || typeof newPassword !== 'string' || newPassword.length < 6) throw new AppError('Current password and a new password of at least 6 characters are required', 400);
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = newPassword;
  user.mustChangePassword = false;
  await user.save();
  generateToken(user, res);
  res.status(200).json({ user: publicUser(user), message: 'Password changed' });
});