/**
 * Order Service – business logic for POS flow
 * Handles order creation, item management, inventory deduction, and status transitions
 */
const pool = require('../db/pool');
const orderRepo     = require('../repositories/order.repository');
const productRepo   = require('../repositories/product.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const ApiError      = require('../utils/ApiError');
const { getIO }     = require('../socket');

// Valid status FSM transitions
const STATUS_TRANSITIONS = {
  pending:   ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready:     ['delivered'],
  delivered: [],
  cancelled: [],
};

const orderService = {
  /** Create a new empty order */
  async createOrder({ type, branch_id, table_id, user_id, notes }) {
    const order = await orderRepo.create({ type, branch_id, table_id, user_id, notes });

    // If dine-in, mark table as occupied
    if (type === 'dine_in' && table_id) {
      await pool.query(
        `UPDATE tables SET status='occupied' WHERE id=$1`,
        [table_id]
      );
    }

    getIO().to(`branch_${branch_id}`).emit('order:created', order);
    return order;
  },

  /** Add item to an existing order */
  async addItem(orderId, { product_id, variant_id, quantity, notes }) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (['delivered', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest(`Cannot add items to a ${order.status} order`);
    }

    // Get price from variant or product
    let unit_price;
    if (variant_id) {
      const { rows } = await pool.query(
        'SELECT price FROM product_variants WHERE id=$1 AND product_id=$2',
        [variant_id, product_id]
      );
      if (!rows[0]) throw ApiError.notFound('Variant not found for this product');
      unit_price = rows[0].price;
    } else {
      const product = await productRepo.findById(product_id);
      if (!product) throw ApiError.notFound('Product not found');
      if (!product.is_available) throw ApiError.badRequest('Product is not available');
      unit_price = product.price;
    }

    const item = await orderRepo.addItem({ order_id: orderId, product_id, variant_id, quantity, unit_price, notes });
    await orderRepo.recalculateTotal(orderId);

    const updatedOrder = await orderRepo.findById(orderId);
    getIO().to(`branch_${order.branch_id}`).emit('order:updated', updatedOrder);
    return item;
  },

  /** Update order status with FSM validation + inventory deduction on delivering */
  async updateStatus(orderId, newStatus, userId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');

    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw ApiError.badRequest(
        `Cannot transition from "${order.status}" to "${newStatus}"`
      );
    }

    // Deduct inventory when order moves to "preparing"
    if (newStatus === 'preparing') {
      await this._deductInventory(order, userId);
    }

    // Free the table when delivered/cancelled
    if (['delivered', 'cancelled'].includes(newStatus) && order.table_id) {
      await pool.query(
        `UPDATE tables SET status='available' WHERE id=$1`,
        [order.table_id]
      );
    }

    const updated = await orderRepo.updateStatus(orderId, newStatus);
    getIO().to(`branch_${order.branch_id}`).emit('order:statusChanged', { id: orderId, status: newStatus });
    return updated;
  },

  /** Inventory deduction – runs in a transaction */
  async _deductInventory(order, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of order.items) {
        const recipe = await inventoryRepo.getRecipe(item.product_id);
        for (const step of recipe) {
          const totalUsed = step.quantity_used * item.quantity;
          if (step.stock_quantity < totalUsed) {
            // Low stock – log warning but don't block
            console.warn(
              `Low stock warning: ${step.ingredient_name} needs ${totalUsed} but has ${step.stock_quantity}`
            );
          }
          await inventoryRepo.adjustStock(step.ingredient_id, -totalUsed, client);
          await inventoryRepo.log(
            {
              ingredient_id: step.ingredient_id,
              change: -totalUsed,
              reason: 'order_deduction',
              order_id: order.id,
              user_id: userId,
            },
            client
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getOrder(id) {
    const order = await orderRepo.findById(id);
    if (!order) throw ApiError.notFound('Order not found');
    return order;
  },

  async listOrders(filters) {
    return orderRepo.findAll(filters);
  },

  async removeItem(orderId, itemId) {
    const order = await orderRepo.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (['delivered', 'cancelled'].includes(order.status)) {
      throw ApiError.badRequest('Cannot modify a closed order');
    }
    await orderRepo.removeItem(orderId, itemId);
    await orderRepo.recalculateTotal(orderId);
    const updated = await orderRepo.findById(orderId);
    getIO().to(`branch_${order.branch_id}`).emit('order:updated', updated);
    return updated;
  },
};

module.exports = orderService;
