/**
 * Product Controller
 */
const productRepo = require('../repositories/product.repository');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { category_id, is_available, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;
  const { rows, total } = await productRepo.findAll({
    category_id: category_id ? parseInt(category_id) : undefined,
    is_available: is_available !== undefined ? is_available === 'true' : undefined,
    limit,
    offset,
  });
  sendPaginated(res, rows, total, page, limit);
};

exports.get = async (req, res) => {
  const product = await productRepo.findById(parseInt(req.params.id));
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product);
};

exports.create = async (req, res) => {
  const product = await productRepo.create(req.body);
  sendCreated(res, product);
};

exports.update = async (req, res) => {
  const product = await productRepo.update(parseInt(req.params.id), req.body);
  if (!product) throw ApiError.notFound('Product not found');
  sendSuccess(res, product);
};

exports.remove = async (req, res) => {
  await productRepo.delete(parseInt(req.params.id));
  sendSuccess(res, null, 'Product deleted');
};

exports.addVariant = async (req, res) => {
  const variant = await productRepo.addVariant({ product_id: parseInt(req.params.id), ...req.body });
  sendCreated(res, variant);
};

exports.updateVariant = async (req, res) => {
  const variant = await productRepo.updateVariant(parseInt(req.params.variantId), req.body);
  sendSuccess(res, variant);
};

exports.removeVariant = async (req, res) => {
  await productRepo.deleteVariant(parseInt(req.params.variantId));
  sendSuccess(res, null, 'Variant removed');
};
