const router = require('express').Router();
const ctrl   = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { z } = require('zod');

const createOrderSchema = z.object({
  type:      z.enum(['dine_in', 'takeaway', 'delivery']).default('dine_in'),
  table_id:  z.number().int().positive().optional(),
  branch_id: z.number().int().positive().optional(),
  notes:     z.string().optional(),
});

const addItemSchema = z.object({
  product_id: z.number().int().positive(),
  variant_id: z.number().int().positive().optional(),
  quantity:   z.number().int().min(1).default(1),
  notes:      z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
});

router.use(authenticate);

router.get('/',                          authorize('orders:read'),   ctrl.listOrders);
router.post('/',   validate(createOrderSchema), authorize('orders:create'), ctrl.createOrder);
router.get('/:id',                       authorize('orders:read'),   ctrl.getOrder);
router.patch('/:id/status', validate(statusSchema), authorize('orders:update'), ctrl.updateStatus);
router.post('/:id/items',   validate(addItemSchema), authorize('orders:update'), ctrl.addItem);
router.delete('/:id/items/:itemId',      authorize('orders:update'), ctrl.removeItem);

module.exports = router;
