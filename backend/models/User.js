const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 2, maxlength: 60, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  password: { type: String, required: true, minlength: 6, select: false },
  type: { type: String, enum: ['student', 'faculty'], required: true },
  roles: { type: [{ type: String, enum: ['panelist', 'coordinator'] }], default: undefined },
  mustChangePassword: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  department: { type: String, trim: true },
  expertiseTags: { type: [String], default: undefined },
  canChair: { type: Boolean, default: undefined },
  maxDefensesPerDay: { type: Number, min: 1, max: 6, default: undefined },
}, { timestamps: true, strict: true });
userSchema.pre('validate', function () {
  if (this.type === 'faculty' && !this.roles) this.roles = ['panelist'];
  if (this.type === 'student') { this.roles = undefined; this.department = undefined; this.expertiseTags = undefined; this.canChair = undefined; this.maxDefensesPerDay = undefined; }
});
userSchema.pre('save', async function () { if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10); });
userSchema.methods.comparePassword = function (candidate) { return bcrypt.compare(candidate, this.password); };
module.exports = mongoose.model('User', userSchema);
