const mongoose = require('mongoose');
const defenseSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, unique: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  chair: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }], validate: [(items) => items.length >= 1, 'At least one panel member is required'] },
  startTime: { type: Date, required: true }, endTime: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'defended', 'revisions', 'cleared'], default: 'scheduled' },
}, { timestamps: true, strict: true });
defenseSchema.path('endTime').validate(function (value) { return !this.startTime || value > this.startTime; }, 'End time must be after start time');
module.exports = mongoose.model('Defense', defenseSchema);
