const router = require('express').Router();
const ctrl   = require('../controllers/inventory.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('inventory:read'));

router.get('/',                 ctrl.list);
router.get('/low-stock',        ctrl.getLowStock);
router.get('/logs',             ctrl.getLogs);
router.post('/',  authorize('inventory:update'), ctrl.create);
router.get('/:id',              ctrl.get);
router.put('/:id', authorize('inventory:update'), ctrl.update);
router.post('/:id/adjust', authorize('inventory:update'), ctrl.adjust);

router.get('/recipes/:productId',  ctrl.getRecipe);
router.post('/recipes/:productId', authorize('inventory:update'), ctrl.upsertRecipe);

module.exports = router;
