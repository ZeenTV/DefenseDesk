const mongoose = require('mongoose');
const evaluationSchema = new mongoose.Schema({
  defense: { type: mongoose.Schema.Types.ObjectId, ref: 'Defense', required: true },
  panelist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scores: { type: [{ criterion: { type: String, required: true, trim: true }, score: { type: Number, required: true, min: 0, max: 100 } }], required: true, validate: [(items) => items.length > 0, 'At least one score is required'] },
  remarks: { type: String, trim: true },
}, { timestamps: true, strict: true });
evaluationSchema.index({ defense: 1, panelist: 1 }, { unique: true });
module.exports = mongoose.model('Evaluation', evaluationSchema);
