/**
 * Inventory Repository
 */
const pool = require('../db/pool');

const inventoryRepo = {
  async findAll({ limit = 50, offset = 0 }) {
    const { rows } = await pool.query(
      `SELECT * FROM ingredients
       ORDER BY name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM ingredients');
    return { rows, total: parseInt(count) };
  },

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM ingredients WHERE id=$1', [id]);
    return rows[0] || null;
  },

  async create({ name, unit, stock_quantity, min_stock, cost_per_unit }) {
    const { rows } = await pool.query(
      `INSERT INTO ingredients (name, unit, stock_quantity, min_stock, cost_per_unit)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, unit, stock_quantity || 0, min_stock || 0, cost_per_unit || 0]
    );
    return rows[0];
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE ingredients SET ${set} WHERE id=$${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0];
  },

  /** Adjust stock by `delta` (can be negative) */
  async adjustStock(id, delta, client = pool) {
    const { rows } = await client.query(
      `UPDATE ingredients
       SET stock_quantity = stock_quantity + $1
       WHERE id = $2
       RETURNING *`,
      [delta, id]
    );
    return rows[0];
  },

  /** Log an inventory change */
  async log({ ingredient_id, change, reason, order_id, user_id }, client = pool) {
    await client.query(
      `INSERT INTO inventory_logs (ingredient_id, change, reason, order_id, user_id)
       VALUES ($1,$2,$3,$4,$5)`,
      [ingredient_id, change, reason, order_id || null, user_id || null]
    );
  },

  async getLogs({ ingredient_id, limit = 50, offset = 0 }) {
    const where = ingredient_id ? `WHERE ingredient_id = $3` : '';
    const values = ingredient_id
      ? [limit, offset, ingredient_id]
      : [limit, offset];

    const { rows } = await pool.query(
      `SELECT il.*, i.name AS ingredient_name
       FROM inventory_logs il
       JOIN ingredients i ON i.id = il.ingredient_id
       ${where}
       ORDER BY il.created_at DESC
       LIMIT $1 OFFSET $2`,
      values
    );
    return rows;
  },

  async getRecipe(product_id) {
    const { rows } = await pool.query(
      `SELECT r.*, i.name AS ingredient_name, i.unit, i.stock_quantity
       FROM recipes r
       JOIN ingredients i ON i.id = r.ingredient_id
       WHERE r.product_id = $1`,
      [product_id]
    );
    return rows;
  },

  async getLowStockAlerts() {
    const { rows } = await pool.query(
      `SELECT * FROM ingredients WHERE stock_quantity <= min_stock ORDER BY stock_quantity ASC`
    );
    return rows;
  },

  async upsertRecipe({ product_id, ingredient_id, quantity_used }) {
    const { rows } = await pool.query(
      `INSERT INTO recipes (product_id, ingredient_id, quantity_used)
       VALUES ($1,$2,$3)
       ON CONFLICT (product_id, ingredient_id)
       DO UPDATE SET quantity_used = EXCLUDED.quantity_used
       RETURNING *`,
      [product_id, ingredient_id, quantity_used]
    );
    return rows[0];
  },
};

module.exports = inventoryRepo;
