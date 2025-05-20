import { validationResult } from "express-validator";
import { ApiError } from "../utils/apiError.js";

export const validate = (req, _res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

  throw new ApiError(422, "Recieved data is not valid", extractedErrors);
};
