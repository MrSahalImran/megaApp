import { body } from "express-validator";

const userRegistrationValidator = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Email is invalid"),
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .isLength({ max: 13 })
      .withMessage("Username should not exceed 13 characters")
      .isLength({ min: 3 })
      .withMessage("Username should not be less than 3 characters"),
  ];
};

const userLoginValidator = () => {
  return [
    body("email").trim().isEmail().withMessage("Email is not valid"),
    body("password").notEmpty().withMessage("Password cannot be empty"),
  ];
};
export { userRegistrationValidator, userLoginValidator };
