/**
 * Order Repository
 */
const pool = require('../db/pool');

const orderRepo = {
  /** Create an order (no items yet) */
  async create({ type, branch_id, table_id, user_id, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO orders (type, branch_id, table_id, user_id, notes)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [type, branch_id, table_id || null, user_id, notes || null]
    );
    return rows[0];
  },

  /** Add item to order */
  async addItem({ order_id, product_id, variant_id, quantity, unit_price, notes }) {
    const { rows } = await pool.query(
      `INSERT INTO order_items (order_id, product_id, variant_id, quantity, unit_price, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [order_id, product_id, variant_id || null, quantity, unit_price, notes || null]
    );
    return rows[0];
  },

  /** Recalculate and persist total price */
  async recalculateTotal(order_id) {
    await pool.query(
      `UPDATE orders
       SET total_price = (
         SELECT COALESCE(SUM(quantity * unit_price), 0)
         FROM order_items WHERE order_id = $1
       )
       WHERE id = $1`,
      [order_id]
    );
  },

  /** Find order by ID with items */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT o.*,
              b.name AS branch_name,
              t.number AS table_number,
              u.name  AS cashier_name
       FROM orders o
       JOIN branches b ON b.id = o.branch_id
       LEFT JOIN tables t ON t.id = o.table_id
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id = $1`,
      [id]
    );
    if (!rows[0]) return null;

    const { rows: items } = await pool.query(
      `SELECT oi.*, p.name AS product_name,
              pv.name AS variant_name
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_variants pv ON pv.id = oi.variant_id
       WHERE oi.order_id = $1`,
      [id]
    );

    return { ...rows[0], items };
  },

  /** List orders (paginated + filters) */
  async findAll({ status, branch_id, type, limit = 20, offset = 0 }) {
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push(`o.status = $${values.length + 1}`);
      values.push(status);
    }
    if (branch_id) {
      conditions.push(`o.branch_id = $${values.length + 1}`);
      values.push(branch_id);
    }
    if (type) {
      conditions.push(`o.type = $${values.length + 1}`);
      values.push(type);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT o.*, b.name AS branch_name, t.number AS table_number
       FROM orders o
       JOIN branches b ON b.id = o.branch_id
       LEFT JOIN tables t ON t.id = o.table_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM orders o ${where}`,
      values.slice(0, -2)
    );

    return { rows, total: parseInt(countRes.rows[0].count) };
  },

  /** Update status */
  async updateStatus(id, status) {
    const { rows } = await pool.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );
    return rows[0];
  },

  /** Soft-cancel order */
  async cancel(id) {
    return this.updateStatus(id, 'cancelled');
  },

  /** Remove an item */
  async removeItem(order_id, item_id) {
    await pool.query(
      'DELETE FROM order_items WHERE id=$1 AND order_id=$2',
      [item_id, order_id]
    );
  },
};

module.exports = orderRepo;
