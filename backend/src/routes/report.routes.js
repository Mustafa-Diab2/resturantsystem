const router = require('express').Router();
const ctrl   = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('reports:read'));

router.get('/daily',        ctrl.daily);
router.get('/weekly',       ctrl.weekly);
router.get('/top-products', ctrl.topProducts);
router.get('/hourly',       ctrl.hourly);

module.exports = router;
