const Evaluation = require('../models/Evaluation');
const Defense = require('../models/Defense');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const isAssigned = (defense, userId) => defense.chair.equals(userId) || defense.members.some((member) => member.equals(userId));
exports.submit = asyncHandler(async (req, res) => {
  const { defense: defenseId, scores, remarks } = req.body || {};
  const defense = await Defense.findById(defenseId);
  if (!defense) throw new AppError('Record not found', 404);
  if (!isAssigned(defense, req.user._id)) throw new AppError('You are not assigned to this defense', 403);
  if (!Array.isArray(scores) || scores.length === 0 || scores.some((item) => !item.criterion || !Number.isFinite(item.score) || item.score < 0 || item.score > 100)) throw new AppError('Scores must contain criteria and values from 0 to 100', 400);
  if (await Evaluation.exists({ defense: defense._id, panelist: req.user._id })) throw new AppError('Evaluation already submitted', 400);
  const evaluation = await Evaluation.create({ defense: defense._id, panelist: req.user._id, scores, remarks });
  res.status(201).json(evaluation);
});
exports.listForDefense = asyncHandler(async (req, res) => {
  const defense = await Defense.findById(req.params.id);
  if (!defense) throw new AppError('Record not found', 404);
  if (!req.user.roles?.includes('coordinator') && !isAssigned(defense, req.user._id)) throw new AppError('You are not assigned to this defense', 403);
  res.json(await Evaluation.find({ defense: defense._id }).populate('panelist', 'name email').sort({ createdAt: 1 }));
});
