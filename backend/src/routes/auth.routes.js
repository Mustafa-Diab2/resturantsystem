const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { z } = require('zod');

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name:      z.string().min(2),
  email:     z.string().email(),
  password:  z.string().min(6),
  role_id:   z.number().int().positive(),
  branch_id: z.number().int().positive().optional(),
});

router.post('/login',    validate(loginSchema),    ctrl.login);
router.post('/register', validate(registerSchema), ctrl.register);
router.post('/refresh',  ctrl.refresh);
router.post('/logout',   authenticate, ctrl.logout);
router.get('/me',        authenticate, ctrl.me);

module.exports = router;
