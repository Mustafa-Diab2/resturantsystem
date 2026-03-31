/**
 * Authentication Service
 */
const bcrypt = require('bcryptjs');
const userRepo = require('../repositories/user.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const authService = {
  async login(email, password) {
    const user = await userRepo.findByEmail(email);
    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.is_active) throw ApiError.unauthorized('Account is disabled');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw ApiError.unauthorized('Invalid email or password');

    const payload = { id: user.id, role: user.role_name, branch: user.branch_id };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });

    // Persist refresh token
    await userRepo.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role_name,
        branch_id: user.branch_id,
      },
    };
  },

  async register({ name, email, password, role_id, branch_id }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) throw ApiError.conflict('Email already registered');

    const password_hash = await bcrypt.hash(password, 12);
    const user = await userRepo.create({ name, email, password_hash, role_id, branch_id });
    return user;
  },

  async refreshTokens(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await userRepo.findByRefreshToken(token);
    if (!user) throw ApiError.unauthorized('Refresh token revoked');

    const payload = { id: user.id, role: user.role_name, branch: user.branch_id };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });
    await userRepo.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  },

  async logout(userId) {
    await userRepo.updateRefreshToken(userId, null);
  },
};

module.exports = authService;
