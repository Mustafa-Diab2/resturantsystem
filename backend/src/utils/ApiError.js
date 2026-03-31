/**
 * Custom API Error class
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message    - Error message
   * @param {any}    details    - Optional extra details
   */
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details    = details;
    this.isOperational = true;
  }

  static badRequest(msg, details)  { return new ApiError(400, msg, details); }
  static unauthorized(msg)         { return new ApiError(401, msg || 'Unauthorized'); }
  static forbidden(msg)            { return new ApiError(403, msg || 'Forbidden'); }
  static notFound(msg)             { return new ApiError(404, msg || 'Not found'); }
  static conflict(msg)             { return new ApiError(409, msg); }
  static internal(msg)             { return new ApiError(500, msg || 'Internal server error'); }
}

module.exports = ApiError;
