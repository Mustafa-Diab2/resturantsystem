/**
 * Category Controller
 */
const pool = require('../db/pool');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM categories WHERE is_active=TRUE ORDER BY sort_order ASC'
  );
  sendSuccess(res, rows);
};

exports.create = async (req, res) => {
  const { name, image_url, sort_order } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO categories (name, image_url, sort_order) VALUES ($1,$2,$3) RETURNING *',
    [name, image_url || null, sort_order || 0]
  );
  sendCreated(res, rows[0]);
};

exports.update = async (req, res) => {
  const { name, image_url, sort_order, is_active } = req.body;
  const { rows } = await pool.query(
    `UPDATE categories SET name=$1, image_url=$2, sort_order=$3, is_active=$4
     WHERE id=$5 RETURNING *`,
    [name, image_url, sort_order, is_active, req.params.id]
  );
  if (!rows[0]) throw ApiError.notFound('Category not found');
  sendSuccess(res, rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
  sendSuccess(res, null, 'Category deleted');
};
