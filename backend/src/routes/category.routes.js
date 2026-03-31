const router = require('express').Router();
const ctrl   = require('../controllers/category.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);
router.get('/',            ctrl.list);
router.post('/',      authorize('products:create'), ctrl.create);
router.put('/:id',    authorize('products:update'), ctrl.update);
router.delete('/:id', authorize('products:delete'), ctrl.remove);

module.exports = router;
