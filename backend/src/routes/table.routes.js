const router = require('express').Router();
const ctrl   = require('../controllers/table.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',            ctrl.list);
router.post('/',      authorize('branches:manage'), ctrl.create);
router.patch('/:id/status', authorize('orders:update'), ctrl.updateStatus);
router.delete('/:id', authorize('branches:manage'), ctrl.remove);

module.exports = router;
