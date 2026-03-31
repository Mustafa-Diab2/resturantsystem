/**
 * Zod validation middleware factory
 * @param {ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'|'params'} target - What part of req to validate
 */
const validate = (schema, target = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) {
    return next(result.error); // handled by errorHandler (ZodError)
  }
  req[target] = result.data; // attach parsed/coerced data
  next();
};

module.exports = { validate };
