const mongoose = require('mongoose');
const Defense = require('../models/Defense');
const Group = require('../models/Group');
const Room = require('../models/Room');
const User = require('../models/User');
const Evaluation = require('../models/Evaluation');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { nextStatus } = require('../utils/defenseRules');

const populated = (query) => query.populate('group').populate('room').populate('chair', 'name email canChair').populate('members', 'name email');
const panelIds = (body) => [body.chair, ...(body.members || [])].map((id) => id?.toString());
const validateDefense = async (data, excludingId) => {
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || endTime <= startTime) throw new AppError('End time must be after start time', 400);
  if (!Array.isArray(data.members) || data.members.length < 1 || new Set(panelIds(data)).size !== data.members.length + 1) throw new AppError('Panel must contain one chair and at least one distinct member', 400);
  const [group, room, faculty] = await Promise.all([Group.findById(data.group), Room.findById(data.room), User.find({ _id: { $in: panelIds(data) }, type: 'faculty', isActive: true })]);
  if (!group || !room) throw new AppError('Group or room not found', 404);
  if (faculty.length !== panelIds(data).length) throw new AppError('Every panelist must be an active faculty account', 400);
  const chair = faculty.find((user) => user._id.toString() === data.chair.toString());
  if (!chair?.canChair) throw new AppError('The selected chair is not eligible to chair defenses', 400);
  if (panelIds(data).includes(group.adviser.toString())) throw new AppError('The group adviser cannot serve on the panel', 400);
  const filter = { startTime: { $lt: endTime }, endTime: { $gt: startTime }, ...(excludingId ? { _id: { $ne: excludingId } } : {}) };
  if (await Defense.exists({ ...filter, room: room._id })) throw new AppError('Room is already booked for that time', 400);
  const overlapping = await Defense.find(filter);
  const overlapPanel = new Set(overlapping.flatMap((item) => panelIds({ chair: item.chair, members: item.members })));
  if (panelIds(data).some((id) => overlapPanel.has(id))) throw new AppError('A panelist is already assigned during that time', 400);
  const dayStart = new Date(startTime); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startTime); dayEnd.setHours(24, 0, 0, 0);
  for (const id of panelIds(data)) {
    const user = faculty.find((person) => person._id.toString() === id);
    if (!Number.isInteger(user.maxDefensesPerDay)) throw new AppError(`${user.name} must have a daily defense limit set`, 400);
    const count = await Defense.countDocuments({ ... (excludingId ? { _id: { $ne: excludingId } } : {}), startTime: { $gte: dayStart, $lt: dayEnd }, $or: [{ chair: id }, { members: id }] });
    if (count >= user.maxDefensesPerDay) throw new AppError(`${user.name} exceeds the daily defense limit`, 400);
  }
  return { startTime, endTime, group, room };
};

exports.list = asyncHandler(async (req, res) => res.json(await populated(Defense.find().sort({ startTime: 1 }))));
exports.get = asyncHandler(async (req, res) => { const defense = await populated(Defense.findById(req.params.id)); if (!defense) throw new AppError('Record not found', 404); res.json(defense); });
exports.create = asyncHandler(async (req, res) => {
  const { startTime, endTime, group } = await validateDefense(req.body || {});
  const defense = await Defense.create({ group: group._id, room: req.body.room, chair: req.body.chair, members: req.body.members, startTime, endTime });
  group.status = 'scheduled'; await group.save();
  res.status(201).json(await populated(Defense.findById(defense._id)));
});
exports.update = asyncHandler(async (req, res) => {
  const defense = await Defense.findById(req.params.id);
  if (!defense) throw new AppError('Record not found', 404);
  const data = { group: req.body?.group ?? defense.group, room: req.body?.room ?? defense.room, chair: req.body?.chair ?? defense.chair, members: req.body?.members ?? defense.members, startTime: req.body?.startTime ?? defense.startTime, endTime: req.body?.endTime ?? defense.endTime };
  if (defense.status !== 'scheduled') throw new AppError('Only scheduled defenses can be rescheduled', 400);
  const checked = await validateDefense(data, defense._id);
  if (data.group.toString() !== defense.group.toString() && await Defense.exists({ group: data.group, _id: { $ne: defense._id } })) throw new AppError('A defense already exists for that group', 400);
  const oldGroup = defense.group;
  Object.assign(defense, data, { group: checked.group._id, startTime: checked.startTime, endTime: checked.endTime });
  await defense.save();
  if (oldGroup.toString() !== checked.group._id.toString()) { await Group.updateOne({ _id: oldGroup }, { $set: { status: 'pending' } }); checked.group.status = 'scheduled'; await checked.group.save(); }
  res.json(await populated(Defense.findById(defense._id)));
});
exports.remove = asyncHandler(async (req, res) => { const defense = await Defense.findById(req.params.id); if (!defense) throw new AppError('Record not found', 404); await Evaluation.deleteMany({ defense: defense._id }); await Group.updateOne({ _id: defense.group }, { $set: { status: 'pending' } }); await defense.deleteOne(); res.json({ message: 'Defense deleted' }); });
exports.changeStatus = asyncHandler(async (req, res) => {
  const next = req.body?.status;
  const defense = await Defense.findById(req.params.id);
  if (!defense) throw new AppError('Record not found', 404);
  if (nextStatus(defense.status) !== next) throw new AppError('Invalid defense status transition', 400);
  defense.status = next; await defense.save();
  await Group.updateOne({ _id: defense.group }, { $set: { status: next } });
  res.json(defense);
});
exports.mine = asyncHandler(async (req, res) => {
  if (req.user.type === 'faculty') return res.json(await populated(Defense.find({ $or: [{ chair: req.user._id }, { members: req.user._id }] }).sort({ startTime: 1 })));
  const group = await Group.findOne({ members: req.user._id }).populate('members', 'name').populate('adviser', 'name');
  if (!group) return res.json(null);
  const defense = await populated(Defense.findOne({ group: group._id }));
  if (!defense) return res.json({ group, defense: null, averageScore: null });
  const evaluations = await Evaluation.find({ defense: defense._id });
  const allScores = evaluations.flatMap((evaluation) => evaluation.scores.map((score) => score.score));
  const averageScore = allScores.length ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : null;
  return res.json({ group, defense, averageScore });
});
exports.availability = asyncHandler(async (req, res) => {
  if (!req.query.date || Number.isNaN(new Date(req.query.date).getTime())) throw new AppError('A valid date query parameter is required', 400);
  const rooms = await Room.find().sort({ name: 1 });
  const dayStart = new Date(req.query.date); dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
  const bookings = await Defense.find({ startTime: { $lt: dayEnd }, endTime: { $gt: dayStart } }).populate('room', 'name');
  res.json({ date: req.query.date, rooms: rooms.map((room) => ({ room, booked: bookings.filter((defense) => defense.room?._id.equals(room._id)).map((defense) => ({ startTime: defense.startTime, endTime: defense.endTime })) })), message: 'Room hours and slot duration are unspecified; availability slots cannot yet be calculated.' });
});
