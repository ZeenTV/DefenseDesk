require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Group = require('../models/Group');
const Room = require('../models/Room');
const Defense = require('../models/Defense');

const getOrCreateUser = async (details) => {
  let user = await User.findOne({ email: details.email.toLowerCase() });
  if (!user) user = await User.create(details);
  return user;
};
const getOrCreateGroup = async (details) => {
  let group = await Group.findOne({ title: details.title });
  if (!group) group = await Group.create(details);
  return group;
};
const getOrCreateRoom = async (details) => {
  let room = await Room.findOne({ name: details.name });
  if (!room) room = await Room.create(details);
  return room;
};
const createDemoData = async (password, coordinator) => {
  const faculty = [];
  for (const details of [
    { name: 'Morgan Lee', email: 'morgan.lee@example.edu', canChair: true, expertiseTags: ['information systems', 'software engineering'] },
    { name: 'Taylor Cruz', email: 'taylor.cruz@example.edu', canChair: true, expertiseTags: ['data science', 'software engineering'] },
    { name: 'Jordan Reyes', email: 'jordan.reyes@example.edu', canChair: false, expertiseTags: ['information systems', 'human-computer interaction'] },
  ]) faculty.push(await getOrCreateUser({ ...details, type: 'faculty', roles: ['panelist'], department: 'Information Technology', maxDefensesPerDay: 3, password, mustChangePassword: true }));
  const students = [];
  for (const [name, email] of [['Alex Santos', 'alex.santos@example.edu'], ['Jamie Flores', 'jamie.flores@example.edu'], ['Sam Rivera', 'sam.rivera@example.edu'], ['Casey Ramos', 'casey.ramos@example.edu'], ['Drew Lim', 'drew.lim@example.edu'], ['Riley Tan', 'riley.tan@example.edu']]) students.push(await getOrCreateUser({ name, email, type: 'student', password, mustChangePassword: true }));
  const groupSpecs = [
    { title: 'Adaptive Campus Guide', members: students.slice(0, 2), adviser: faculty[2], projectArea: 'information systems' },
    { title: 'Research Insight Portal', members: students.slice(2, 4), adviser: faculty[0], projectArea: 'data science' },
    { title: 'Accessible Queue Manager', members: students.slice(4, 6), adviser: faculty[1], projectArea: 'human-computer interaction' },
  ];
  const groups = [];
  for (const spec of groupSpecs) groups.push(await getOrCreateGroup(spec));
  const rooms = await Promise.all([getOrCreateRoom({ name: 'Innovation Hall 204', capacity: 40, equipment: ['Projector', 'Whiteboard'] }), getOrCreateRoom({ name: 'Innovation Hall 206', capacity: 32, equipment: ['Projector'] })]);
  const now = new Date();
  const at = (dayOffset, hour) => { const date = new Date(now); date.setDate(date.getDate() + dayOffset); date.setHours(hour, 0, 0, 0); return date; };
  const setups = [
    { group: groups[0], room: rooms[0], chair: faculty[0], members: [faculty[1], coordinator], startTime: at(-8, 10), endTime: at(-8, 11), status: 'defended' },
    { group: groups[1], room: rooms[1], chair: faculty[1], members: [faculty[2], coordinator], startTime: at(-4, 13), endTime: at(-4, 14), status: 'revisions' },
    { group: groups[2], room: rooms[0], chair: faculty[0], members: [faculty[2], coordinator], startTime: at(2, 10), endTime: at(2, 11), status: 'scheduled' },
  ];
  for (const setup of setups) {
    let defense = await Defense.findOne({ group: setup.group._id });
    if (!defense) defense = await Defense.create(setup);
    setup.group.status = defense.status;
    await setup.group.save();
  }
};

const seedData = async () => {
  const { MONGO_URI, SEED_COORDINATOR_NAME, SEED_COORDINATOR_EMAIL, SEED_COORDINATOR_PASSWORD, SEED_DEMO_PASSWORD } = process.env;
  if (!MONGO_URI || !SEED_COORDINATOR_NAME || !SEED_COORDINATOR_EMAIL || !SEED_COORDINATOR_PASSWORD) throw new Error('Set MONGO_URI and the four SEED_COORDINATOR_* values before seeding');
  await mongoose.connect(MONGO_URI);
  let coordinator = await User.findOne({ email: SEED_COORDINATOR_EMAIL.toLowerCase() });
  if (!coordinator) coordinator = await User.create({ name: SEED_COORDINATOR_NAME, email: SEED_COORDINATOR_EMAIL, password: SEED_COORDINATOR_PASSWORD, type: 'faculty', roles: ['panelist', 'coordinator'], department: 'Information Technology', expertiseTags: [], canChair: false, maxDefensesPerDay: 3, mustChangePassword: true });
  if (coordinator.type !== 'faculty') throw new Error('The configured coordinator account must be a faculty account');
  coordinator.roles = [...new Set([...(coordinator.roles || []), 'panelist', 'coordinator'])];
  await coordinator.save();
  if (SEED_DEMO_PASSWORD) await createDemoData(SEED_DEMO_PASSWORD, coordinator);
  console.log(SEED_DEMO_PASSWORD ? 'Coordinator and demo accounts are ready.' : 'Coordinator account is ready. Set SEED_DEMO_PASSWORD to add repeatable demo data.');
  await mongoose.disconnect();
};

seedData().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exit(1); });
