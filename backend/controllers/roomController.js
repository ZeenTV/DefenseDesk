const Room = require('../models/Room');
const Defense = require('../models/Defense');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
exports.list = asyncHandler(async (req, res) => res.json(await Room.find().sort({ name: 1 })));
exports.create = asyncHandler(async (req, res) => { const room = await Room.create(req.body || {}); res.status(201).json(room); });
exports.update = asyncHandler(async (req, res) => { const room = await Room.findById(req.params.id); if (!room) throw new AppError('Record not found', 404); for (const key of ['name', 'capacity', 'equipment']) if (req.body?.[key] !== undefined) room[key] = req.body[key]; await room.save(); res.json(room); });
exports.remove = asyncHandler(async (req, res) => { const room = await Room.findById(req.params.id); if (!room) throw new AppError('Record not found', 404); if (await Defense.exists({ room: room._id, status: 'scheduled' })) throw new AppError('Cannot delete a room with scheduled defenses', 400); await room.deleteOne(); res.json({ message: 'Room deleted' }); });
