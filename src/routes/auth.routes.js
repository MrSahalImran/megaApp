import { Router } from "express";
import {
  changepassword,
  loginUser,
  logoutUser,
  passwordReset,
  registerUser,
  resendVerificationEmail,
  verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middleware.js";
import { userRegistrationValidator } from "../validators/index.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", userRegistrationValidator(), validate, registerUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", loginUser);
router.get("/logout", isLoggedIn, logoutUser);
router.post("/resend-email", resendVerificationEmail);
router.post("/forgot-password", passwordReset);
router.post("/reset-password/:token", changepassword);

export default router;
