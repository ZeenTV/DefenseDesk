const test = require('node:test');
const assert = require('node:assert/strict');
const { hasOverlap, nextStatus, calculatePassRate } = require('../utils/defenseRules');

test('defense transitions follow the documented order', () => {
  assert.equal(nextStatus('scheduled'), 'defended');
  assert.equal(nextStatus('defended'), 'revisions');
  assert.equal(nextStatus('revisions'), 'cleared');
  assert.equal(nextStatus('cleared'), null);
});

test('overlap treats touching time boundaries as available', () => {
  assert.equal(hasOverlap('2026-10-07T10:00:00Z', '2026-10-07T11:00:00Z', '2026-10-07T11:00:00Z', '2026-10-07T12:00:00Z'), false);
  assert.equal(hasOverlap('2026-10-07T10:00:00Z', '2026-10-07T11:00:00Z', '2026-10-07T10:30:00Z', '2026-10-07T11:30:00Z'), true);
});

test('pass rate is the share of defense averages at or above 75', () => {
  assert.equal(calculatePassRate([74.9, 75, 90]), 2 / 3);
  assert.equal(calculatePassRate([]), 0);
});
