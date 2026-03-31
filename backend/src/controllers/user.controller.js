/**
 * User Controller
 */
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');
const { sendSuccess, sendCreated, sendPaginated } = require('../utils/response');
const ApiError = require('../utils/ApiError');

exports.list = async (req, res) => {
  const { branch_id, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const { rows, total } = await userRepo.findAll({ branch_id, limit, offset });
  sendPaginated(res, rows, total, page, limit);
};

exports.get = async (req, res) => {
  const user = await userRepo.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  sendSuccess(res, user);
};

exports.update = async (req, res) => {
  const { name, role_id, branch_id, is_active, password } = req.body;
  const fields = {};
  if (name       !== undefined) fields.name       = name;
  if (role_id    !== undefined) fields.role_id    = role_id;
  if (branch_id  !== undefined) fields.branch_id  = branch_id;
  if (is_active  !== undefined) fields.is_active  = is_active;
  if (password) fields.password_hash = await bcrypt.hash(password, 12);

  const user = await userRepo.update(req.params.id, fields);
  sendSuccess(res, user);
};

exports.remove = async (req, res) => {
  await userRepo.delete(req.params.id);
  sendSuccess(res, null, 'User deleted');
};
