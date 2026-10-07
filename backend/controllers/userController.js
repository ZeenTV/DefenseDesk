const crypto = require('crypto');
const User = require('../models/User');
const Group = require('../models/Group');
const Defense = require('../models/Defense');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const safeUser = (user) => { const value = user.toObject ? user.toObject() : user; delete value.password; return value; };
const temporaryPassword = () => crypto.randomBytes(9).toString('base64url');

exports.list = asyncHandler(async (req, res) => { const users = await User.find().sort({ name: 1 }); res.json(users.map(safeUser)); });
exports.get = asyncHandler(async (req, res) => { const user = await User.findById(req.params.id); if (!user) throw new AppError('Record not found', 404); res.json(safeUser(user)); });
exports.create = asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!['student', 'faculty'].includes(body.type)) throw new AppError('Type must be student or faculty', 400);
  const password = temporaryPassword();
  const details = { name: body.name, email: body.email, password, type: body.type, mustChangePassword: true };
  if (body.type === 'faculty') {
    if (!Number.isInteger(body.maxDefensesPerDay) || body.maxDefensesPerDay < 1 || body.maxDefensesPerDay > 6) throw new AppError('Faculty maxDefensesPerDay must be between 1 and 6', 400);
    Object.assign(details, { roles: ['panelist'], department: body.department, expertiseTags: body.expertiseTags, canChair: body.canChair ?? false, maxDefensesPerDay: body.maxDefensesPerDay });
  }
  const user = await User.create(details);
  res.status(201).json({ user: safeUser(user), temporaryPassword: password });
});
exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Record not found', 404);
  if (user.roles?.includes('coordinator') && req.body?.isActive === false && user.isActive && (await User.countDocuments({ roles: 'coordinator', isActive: true })) <= 1) throw new AppError('Cannot deactivate the last coordinator', 400);
  const allowed = ['name', 'email', 'isActive', 'department', 'expertiseTags', 'canChair', 'maxDefensesPerDay'];
  for (const key of allowed) if (req.body?.[key] !== undefined) user[key] = req.body[key];
  await user.save();
  res.json(safeUser(user));
});
exports.remove = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Record not found', 404);
  if (user.roles?.includes('coordinator')) {
    const [coordinators, activeCoordinators] = await Promise.all([User.countDocuments({ roles: 'coordinator' }), User.countDocuments({ roles: 'coordinator', isActive: true })]);
    if (coordinators <= 1 || (user.isActive && activeCoordinators <= 1)) throw new AppError('Cannot delete the last coordinator', 400);
  }
  if (user.type === 'faculty') {
    const [assigned, advised] = await Promise.all([Defense.exists({ $or: [{ chair: user._id }, { members: user._id }] }), Group.exists({ adviser: user._id })]);
    if (assigned || advised) throw new AppError('Cannot delete faculty with assigned defenses or advisees', 400);
  } else if (await Group.exists({ members: user._id, status: { $ne: 'cleared' } })) throw new AppError('Cannot delete a student in an active group', 400);
  if (user.type === 'student') await Group.updateMany({ members: user._id }, { $pull: { members: user._id } });
  await user.deleteOne();
  res.json({ message: 'User deleted' });
});
exports.updateRoles = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('Record not found', 404);
  if (user.type !== 'faculty') throw new AppError('Only faculty accounts can hold the coordinator role', 400);
  const grant = req.body?.coordinator;
  if (typeof grant !== 'boolean') throw new AppError('coordinator must be a boolean', 400);
  const roles = new Set(user.roles || ['panelist']);
  if (grant) roles.add('coordinator');
  else {
    if (roles.has('coordinator')) {
      const [coordinators, activeCoordinators] = await Promise.all([User.countDocuments({ roles: 'coordinator' }), User.countDocuments({ roles: 'coordinator', isActive: true })]);
      if (coordinators <= 1 || (user.isActive && activeCoordinators <= 1)) throw new AppError('Cannot remove the last coordinator', 400);
    }
    roles.delete('coordinator');
  }
  user.roles = [...roles];
  await user.save();
  res.json(safeUser(user));
});
