const router = require('express').Router();
const ctrl   = require('../controllers/branch.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',            ctrl.list);
router.get('/:id',         ctrl.get);
router.post('/',      authorize('branches:manage'), ctrl.create);
router.put('/:id',    authorize('branches:manage'), ctrl.update);
router.delete('/:id', authorize('branches:manage'), ctrl.remove);

module.exports = router;
