const router = require('express').Router();
const controller = require('../controllers/roomController');
const { protect, restrictTo } = require('../middlewares/auth');
router.use(protect, restrictTo('coordinator'));
router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
