/**
 * Branch Controller
 */
const pool = require('../db/pool');
const { sendSuccess, sendCreated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM branches ORDER BY name ASC');
  sendSuccess(res, rows);
};

exports.get = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM branches WHERE id=$1', [req.params.id]);
  if (!rows[0]) throw ApiError.notFound('Branch not found');
  sendSuccess(res, rows[0]);
};

exports.create = async (req, res) => {
  const { name, location, phone } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO branches (name, location, phone) VALUES ($1,$2,$3) RETURNING *',
    [name, location || null, phone || null]
  );
  sendCreated(res, rows[0]);
};

exports.update = async (req, res) => {
  const { name, location, phone, is_active } = req.body;
  const { rows } = await pool.query(
    `UPDATE branches SET
       name=$1, location=$2, phone=$3, is_active=$4
     WHERE id=$5 RETURNING *`,
    [name, location, phone, is_active, req.params.id]
  );
  if (!rows[0]) throw ApiError.notFound('Branch not found');
  sendSuccess(res, rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM branches WHERE id=$1', [req.params.id]);
  sendSuccess(res, null, 'Branch deleted');
};
