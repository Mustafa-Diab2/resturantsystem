/**
 * Auth Controller
 */
const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  sendSuccess(res, data, 'Login successful');
};

exports.register = async (req, res) => {
  const user = await authService.register(req.body);
  sendCreated(res, user, 'User registered');
};

exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshTokens(refreshToken);
  sendSuccess(res, tokens);
};

exports.logout = async (req, res) => {
  await authService.logout(req.user.id);
  sendSuccess(res, null, 'Logged out');
};

exports.me = async (req, res) => {
  sendSuccess(res, req.user);
};
