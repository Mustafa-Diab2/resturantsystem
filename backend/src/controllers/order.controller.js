/**
 * Order Controller
 */
const orderService = require('../services/order.service');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');

exports.createOrder = async (req, res) => {
  const order = await orderService.createOrder({
    ...req.body,
    user_id: req.user.id,
    branch_id: req.body.branch_id || req.user.branch_id,
  });
  sendCreated(res, order, 'Order created');
};

exports.listOrders = async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;
  const branch_id = req.query.branch_id || req.user.branch_id;
  const offset = (page - 1) * limit;
  const { rows, total } = await orderService.listOrders({ status, branch_id, type, limit, offset });
  sendPaginated(res, rows, total, page, limit);
};

exports.getOrder = async (req, res) => {
  const order = await orderService.getOrder(req.params.id);
  sendSuccess(res, order);
};

exports.addItem = async (req, res) => {
  const item = await orderService.addItem(req.params.id, req.body);
  sendCreated(res, item, 'Item added');
};

exports.removeItem = async (req, res) => {
  const updated = await orderService.removeItem(req.params.id, req.params.itemId);
  sendSuccess(res, updated, 'Item removed');
};

exports.updateStatus = async (req, res) => {
  const updated = await orderService.updateStatus(req.params.id, req.body.status, req.user.id);
  sendSuccess(res, updated, 'Status updated');
};
