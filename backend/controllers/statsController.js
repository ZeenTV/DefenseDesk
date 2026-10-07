const Defense = require('../models/Defense');
const Evaluation = require('../models/Evaluation');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { calculatePassRate } = require('../utils/defenseRules');
exports.overview = asyncHandler(async (req, res) => {
  const [defenses, evaluations, faculty] = await Promise.all([Defense.find().lean(), Evaluation.find().lean(), User.find({ type: 'faculty', isActive: true }).select('name')]);
  const perDay = new Map();
  for (const defense of defenses) { const day = new Date(defense.startTime).toISOString().slice(0, 10); perDay.set(day, (perDay.get(day) || 0) + 1); }
  const criteria = new Map();
  for (const evaluation of evaluations) for (const score of evaluation.scores) { const entry = criteria.get(score.criterion) || { total: 0, count: 0 }; entry.total += score.score; entry.count += 1; criteria.set(score.criterion, entry); }
  const totals = new Map();
  for (const evaluation of evaluations) { const entry = totals.get(evaluation.defense.toString()) || { total: 0, count: 0 }; for (const score of evaluation.scores) { entry.total += score.score; entry.count += 1; } totals.set(evaluation.defense.toString(), entry); }
  const defenseMeans = [...totals.values()].map((entry) => entry.total / entry.count);
  const panelistLoad = faculty.map((user) => ({ user: { _id: user._id, name: user.name }, defenseCount: defenses.filter((defense) => defense.chair.equals(user._id) || defense.members.some((id) => id.equals(user._id))).length }));
  res.json({ defensesPerDay: Object.fromEntries([...perDay].sort(([a], [b]) => a.localeCompare(b))), averageScorePerCriterion: Object.fromEntries([...criteria].map(([name, item]) => [name, item.total / item.count])), passRate: calculatePassRate(defenseMeans, 75), passingMark: 75, panelistLoad });
});
