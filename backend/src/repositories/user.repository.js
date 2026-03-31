/**
 * User Repository – raw DB operations for users
 */
const pool = require('../db/pool');

const userRepo = {
  /** Find user by email (includes password_hash) */
  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT u.*, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.email = $1`,
      [email]
    );
    return rows[0] || null;
  },

  /** Find user by ID */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.branch_id,
              u.is_active, u.created_at, r.name AS role_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  /** Get all permissions for a user via their role */
  async getPermissions(userId) {
    const { rows } = await pool.query(
      `SELECT p.name
       FROM users u
       JOIN role_permissions rp ON rp.role_id = u.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE u.id = $1`,
      [userId]
    );
    return rows.map(r => r.name);
  },

  /** List all users (paginated) */
  async findAll({ limit = 20, offset = 0, branch_id }) {
    const conditions = [];
    const values = [];
    if (branch_id) {
      conditions.push(`u.branch_id = $${values.length + 1}`);
      values.push(branch_id);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.branch_id,
              u.is_active, u.created_at, r.name AS role_name,
              b.name AS branch_name
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN branches b ON b.id = u.branch_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users u ${where}`,
      values.slice(0, -2)
    );
    return { rows, total: parseInt(countRes.rows[0].count) };
  },

  /** Create user */
  async create({ name, email, password_hash, role_id, branch_id }) {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id, branch_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role_id, branch_id, created_at`,
      [name, email, password_hash, role_id, branch_id || null]
    );
    return rows[0];
  },

  /** Update refresh token */
  async updateRefreshToken(id, token) {
    await pool.query('UPDATE users SET refresh_token=$1 WHERE id=$2', [token, id]);
  },

  /** Find by refresh token */
  async findByRefreshToken(token) {
    const { rows } = await pool.query(
      `SELECT u.*, r.name AS role_name FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.refresh_token = $1`,
      [token]
    );
    return rows[0] || null;
  },

  /** Update user */
  async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const set = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await pool.query(
      `UPDATE users SET ${set} WHERE id = $${keys.length + 1}
       RETURNING id, name, email, role_id, branch_id, is_active`,
      [...values, id]
    );
    return rows[0];
  },

  /** Delete user */
  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  },
};

module.exports = userRepo;
