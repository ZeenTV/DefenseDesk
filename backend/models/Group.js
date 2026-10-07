const mongoose = require('mongoose');
const groupSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  adviser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectArea: { type: String, required: true, trim: true },
  status: { type: String, enum: ['pending', 'scheduled', 'defended', 'revisions', 'cleared'], default: 'pending' },
}, { timestamps: true, strict: true });
module.exports = mongoose.model('Group', groupSchema);
