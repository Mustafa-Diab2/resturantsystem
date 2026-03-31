/**
 * Authentication & Authorization Middleware
 */
const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const userRepo = require('../repositories/user.repository');

/**
 * Verifies Bearer JWT and attaches user to req.user
 */
const authenticate = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token); // throws on invalid

  // Fetch fresh user from DB to check is_active
  const user = await userRepo.findById(decoded.id);
  if (!user || !user.is_active) {
    throw ApiError.unauthorized('User account is inactive or not found');
  }

  req.user = user;
  next();
};

/**
 * Checks if the user's role has the required permission
 * @param {string} permission - e.g. 'orders:create'
 */
const authorize = (permission) => async (req, _res, next) => {
  const perms = await userRepo.getPermissions(req.user.id);
  if (!perms.includes(permission)) {
    throw ApiError.forbidden(`Missing permission: ${permission}`);
  }
  next();
};

module.exports = { authenticate, authorize };
