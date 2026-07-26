const AppError = require("../utils/AppError");

// checks req.body against a zod schema, replaces body with the cleaned result
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    const err = new AppError("Please check the highlighted fields", 400);
    err.name = "VALIDATION_ERROR";
    err.details = details; // frontend uses this to show errors under the right inputs
    return next(err);
  }

  req.body = result.data;
  next();
};

module.exports = validate;