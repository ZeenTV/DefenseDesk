const router = require('express').Router();
const controller = require('../controllers/statsController');
const { protect, restrictTo } = require('../middlewares/auth');
router.get('/overview', protect, restrictTo('coordinator'), controller.overview);
module.exports = router;
