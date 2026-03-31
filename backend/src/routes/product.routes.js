const router = require('express').Router();
const ctrl   = require('../controllers/product.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { z } = require('zod');

const productSchema = z.object({
  name:        z.string().min(1),
  price:       z.number().positive(),
  category_id: z.number().int().positive(),
  description: z.string().optional(),
  image_url:   z.string().url().optional(),
  sku:         z.string().optional(),
  is_available:z.boolean().optional(),
});

const variantSchema = z.object({
  name:  z.string().min(1),
  price: z.number().positive(),
});

router.use(authenticate);

router.get('/',                    authorize('products:read'),   ctrl.list);
router.post('/',  validate(productSchema), authorize('products:create'), ctrl.create);
router.get('/:id',                 authorize('products:read'),   ctrl.get);
router.put('/:id', validate(productSchema.partial()), authorize('products:update'), ctrl.update);
router.delete('/:id',              authorize('products:delete'), ctrl.remove);

router.post('/:id/variants',  validate(variantSchema), authorize('products:update'), ctrl.addVariant);
router.put('/:id/variants/:variantId', validate(variantSchema.partial()), authorize('products:update'), ctrl.updateVariant);
router.delete('/:id/variants/:variantId', authorize('products:update'), ctrl.removeVariant);

module.exports = router;
