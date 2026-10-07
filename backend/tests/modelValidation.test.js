const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../models/User');
const Room = require('../models/Room');
const Defense = require('../models/Defense');
const Evaluation = require('../models/Evaluation');

test('faculty defaults to the panelist role and student faculty-only fields are removed', async () => {
  const faculty = new User({ name: 'Faculty Member', email: 'faculty@example.edu', password: 'secret1', type: 'faculty' });
  await faculty.validate();
  assert.deepEqual(faculty.roles, ['panelist']);
  const student = new User({ name: 'Student Member', email: 'student@example.edu', password: 'secret1', type: 'student', roles: ['coordinator'], department: 'IT' });
  await student.validate();
  assert.equal(student.roles, undefined);
  assert.equal(student.department, 'IT');
});

test('room capacity must be at least one', async () => {
  const room = new Room({ name: 'Room 0', capacity: 0 });
  await assert.rejects(room.validate(), /capacity/);
});

test('defense schema rejects reversed times and panels with fewer than two members', async () => {
  const defense = new Defense({ group: '507f1f77bcf86cd799439011', room: '507f1f77bcf86cd799439012', chair: '507f1f77bcf86cd799439013', members: ['507f1f77bcf86cd799439014'], startTime: '2026-10-07T11:00:00Z', endTime: '2026-10-07T10:00:00Z' });
  await assert.rejects(defense.validate());
});

test('evaluation scores must remain between zero and one hundred', async () => {
  const evaluation = new Evaluation({ defense: '507f1f77bcf86cd799439011', panelist: '507f1f77bcf86cd799439013', scores: [{ criterion: 'Criterion', score: 101 }] });
  await assert.rejects(evaluation.validate(), /score/);
});
