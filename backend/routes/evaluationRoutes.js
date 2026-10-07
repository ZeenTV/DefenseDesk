const router = require('express').Router();
const controller = require('../controllers/evaluationController');
const { protect, restrictTo } = require('../middlewares/auth');
router.post('/', protect, restrictTo('faculty'), controller.submit);
module.exports = router;
