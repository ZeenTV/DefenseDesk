const router = require('express').Router();
const controller = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
router.post('/login', controller.login);
router.post('/logout', protect, controller.logout);
router.get('/me', protect, controller.me);
router.patch('/password', protect, controller.changePassword);
module.exports = router;
