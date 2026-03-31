const router = require('express').Router();
const ctrl   = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',     authorize('users:read'),   ctrl.list);
router.get('/:id',  authorize('users:read'),   ctrl.get);
router.put('/:id',  authorize('users:update'), ctrl.update);
router.delete('/:id', authorize('users:delete'), ctrl.remove);

module.exports = router;
