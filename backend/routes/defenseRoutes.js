const router = require('express').Router();
const controller = require('../controllers/defenseController');
const evaluations = require('../controllers/evaluationController');
const { protect, restrictTo } = require('../middlewares/auth');
router.use(protect);
router.get('/availability', restrictTo('coordinator'), controller.availability);
router.get('/mine', restrictTo('faculty', 'student'), controller.mine);
