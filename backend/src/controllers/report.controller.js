/**
 * Report Controller
 */
const reportService = require('../services/report.service');
const { sendSuccess } = require('../utils/response');

exports.daily = async (req, res) => {
  const data = await reportService.dailySales(req.query);
  sendSuccess(res, data);
};

exports.weekly = async (req, res) => {
  const data = await reportService.weeklyRevenue(req.query);
  sendSuccess(res, data);
};

exports.topProducts = async (req, res) => {
  const data = await reportService.topProducts(req.query);
  sendSuccess(res, data);
};

exports.hourly = async (req, res) => {
  const data = await reportService.hourlySales(req.query);
  sendSuccess(res, data);
};
