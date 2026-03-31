/**
 * Inventory Controller
 */
const inventoryRepo  = require('../repositories/inventory.repository');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const { rows, total } = await inventoryRepo.findAll({ limit, offset });
  sendPaginated(res, rows, total, page, limit);
};

exports.get = async (req, res) => {
  const ing = await inventoryRepo.findById(parseInt(req.params.id));
  if (!ing) throw ApiError.notFound('Ingredient not found');
  sendSuccess(res, ing);
};

exports.create = async (req, res) => {
  const ing = await inventoryRepo.create(req.body);
  sendCreated(res, ing);
};

exports.update = async (req, res) => {
  const ing = await inventoryRepo.update(parseInt(req.params.id), req.body);
  if (!ing) throw ApiError.notFound('Ingredient not found');
  sendSuccess(res, ing);
};

exports.adjust = async (req, res) => {
  const { delta, reason } = req.body;
  const ing = await inventoryRepo.adjustStock(parseInt(req.params.id), delta);
  await inventoryRepo.log({
    ingredient_id: ing.id,
    change: delta,
    reason,
    user_id: req.user.id,
  });
  sendSuccess(res, ing, 'Stock adjusted');
};

exports.getLogs = async (req, res) => {
  const { ingredient_id, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const logs = await inventoryRepo.getLogs({ ingredient_id, limit, offset });
  sendSuccess(res, logs);
};

exports.getLowStock = async (req, res) => {
  const items = await inventoryRepo.getLowStockAlerts();
  sendSuccess(res, items);
};

exports.upsertRecipe = async (req, res) => {
  const recipe = await inventoryRepo.upsertRecipe({
    product_id: parseInt(req.params.productId),
    ...req.body,
  });
  sendSuccess(res, recipe);
};

exports.getRecipe = async (req, res) => {
  const recipe = await inventoryRepo.getRecipe(parseInt(req.params.productId));
  sendSuccess(res, recipe);
};
