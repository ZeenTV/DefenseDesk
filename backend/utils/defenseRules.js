const transitions = { scheduled: 'defended', defended: 'revisions', revisions: 'cleared' };
const hasOverlap = (existingStart, existingEnd, newStart, newEnd) => new Date(existingStart) < new Date(newEnd) && new Date(existingEnd) > new Date(newStart);
const nextStatus = (currentStatus) => transitions[currentStatus] || null;
const calculatePassRate = (averages, passingMark = 75) => averages.length ? averages.filter((average) => average >= passingMark).length / averages.length : 0;
module.exports = { hasOverlap, nextStatus, calculatePassRate };
