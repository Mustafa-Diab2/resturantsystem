/**
 * Product Repository
 */
const pool = require('../db/pool');

const productRepo = {
  async findAll({ category_id, is_available, limit = 50, offset = 0 }) {
    const conditions = [];
    const values = [];

    if (category_id) {
      conditions.push(`p.category_id = $${values.length + 1}`);
      values.push(category_id);
    }
    if (is_available !== undefined) {
      conditions.push(`p.is_available = $${values.length + 1}`);
      values.push(is_available);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       ${where}
       ORDER BY p.name ASC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    // Attach variants
    for (const product of rows) {
      const { rows: variants } = await pool.query(
        'SELECT * FROM product_variants WHERE product_id=$1 AND is_active=TRUE',
        [product.id]
      );
      product.variants = variants;
    }

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      values.slice(0, -2)
    );

    return { rows, total: parseInt(countRes.rows[0].count) };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const { rows: variants } = await pool.query(
      'SELECT * FROM product_variants WHERE product_id=$1',
      [id]
    );
    return { ...rows[0], variants };
  },

  async create({ name, description, price, image_url, category_id, sku }) {
    const { rows } = await pool.query(
      `INSERT INTO products (name, description, price, image_url, category_id, sku)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, description || null, price, image_url || null, category_id, sku || null]
    );
    return rows[0];
  },

  async update(id, fields) {
    const allowed = ['name', 'description', 'price', 'image_url', 'category_id', 'is_available', 'sku'];
    const filtered = Object.fromEntries(
      Object.entries(fields).filter(([k]) => allowed.includes(k))
    );
    const keys = Object.keys(filtered);
    if (!keys.length) return this.findById(id);
    const values = Object.values(filtered);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE products SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0];
  },

  async delete(id) {
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
  },

  async addVariant({ product_id, name, price }) {
    const { rows } = await pool.query(
      'INSERT INTO product_variants (product_id, name, price) VALUES ($1,$2,$3) RETURNING *',
      [product_id, name, price]
    );
    return rows[0];
  },

  async updateVariant(id, { name, price, is_active }) {
    const { rows } = await pool.query(
      'UPDATE product_variants SET name=$1, price=$2, is_active=$3 WHERE id=$4 RETURNING *',
      [name, price, is_active, id]
    );
    return rows[0];
  },

  async deleteVariant(id) {
    await pool.query('DELETE FROM product_variants WHERE id=$1', [id]);
  },
};

module.exports = productRepo;
