/**
 * Table Controller
 */
const pool = require('../db/pool');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { branch_id, status } = req.query;
  const conditions = [];
  const values = [];
  if (branch_id) { conditions.push(`branch_id = $${values.push(branch_id)}`); }
  if (status)    { conditions.push(`status = $${values.push(status)}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM tables ${where} ORDER BY number ASC`,
    values
  );
  sendSuccess(res, rows);
};

exports.create = async (req, res) => {
  const { number, capacity, branch_id } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO tables (number, capacity, branch_id) VALUES ($1,$2,$3) RETURNING *',
    [number, capacity || 4, branch_id]
  );
  sendCreated(res, rows[0]);
};

exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  const { rows } = await pool.query(
    `UPDATE tables SET status=$1 WHERE id=$2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) throw ApiError.notFound('Table not found');
  sendSuccess(res, rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM tables WHERE id=$1', [req.params.id]);
  sendSuccess(res, null, 'Table deleted');
};
