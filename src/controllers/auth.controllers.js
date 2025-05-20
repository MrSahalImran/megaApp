import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import {
  emailVerificationMailGenContent,
  forgotPasswordMailGenContent,
  sendMail,
} from "../utils/mail.js";
import { apiV1 } from "../utils/constants.js";
import { ApiResponse } from "../utils/apiResponse.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// register user
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, fullname } = req.body;

  if (!email || !password || !username || !fullname) {
    throw new ApiError(400, "Bad request", "Credentials missing");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const newUser = await User.create({ email, username, password, fullname });

  if (!newUser) {
    throw new ApiError(400, "User not created");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    await newUser.generateTemporaryToken();

  newUser.emailVerificationToken = hashedToken;

  newUser.emailVerificationTokenExpiry = tokenExpiry;

  await newUser.save();

  const verificatioUrl = `${process.env.BASE_URL}${apiV1}users/verify-email/${unHashedToken}`;

  const mailContent = emailVerificationMailGenContent(
    newUser.username,
    verificatioUrl,
  );

  await sendMail({
    email: newUser.email,
    subject: "Verify your Email",
    mailGenContent: mailContent,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        username: newUser.username,
        email: newUser.email,
      },
      "User created successfull",
    ),
  );
});

// verifyemail
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    throw new ApiError(400, "Invalid verification token");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpiry = undefined;

  await user.save();

  res.status(200).json(new ApiResponse(200, "Email verified successfully."));
});

// login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Bad request", "Invalid credentials");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(400, "Bad request", "User not found");
  }

  const isMatch = await user.isPasswordCorrect(password);
  if (!isMatch) {
    throw new ApiError(403, "Password does not match");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(401, "please verify your email");
  }

  const refreshToken = await user.generateRefreshToken();
  const accessToken = await user.generateAccessToken();

  user.refreshToken = refreshToken;

  user.save();

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 20 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken: accessToken }, "login successfull"),
    );
});

// logout
const logoutUser = asyncHandler(async (req, res) => {
  const id = req.user.id;
  await User.findByIdAndUpdate(id, { refreshToken: null });
  res.clearCookie("accessToken");
  res.status(200).json(new ApiResponse(200, "logged out successfully"));
});

// resendverificationemail
const resendVerificationEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email not provided");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "User already verified");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    await user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationTokenExpiry = tokenExpiry;

  await user.save();

  const verificationUrl = `${process.env.BASE_URL}${apiV1}users/verify-email/${unHashedToken}`;

  const mailContent = emailVerificationMailGenContent(
    user.username,
    verificationUrl,
  );

  sendMail({
    email: user.email,
    subject: "Verify Your email",
    mailGenContent: mailContent,
  });

  res.status(200).json(new ApiResponse(200, "Verification Email resent"));
});

// refreshAccesstoken
const refreshAccessTokenCheck = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new ApiError(400, "Token not found");
  }

  const decodedRefreshToken = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
  );

  const user = await User.findById(decodedRefreshToken._id);

  if (!user) {
    throw new ApiError(400, "No User found");
  }

  if (user.refreshToken !== refreshToken) {
    throw new ApiError(403, "Invalid refresh token");
  }

  const newAccessToken = user.generateAccessToken();
  const newRefreshToken = user.generateRefreshToken();

  user.refreshToken = newRefreshToken;

  await user.save();

  res.cookie("accessToken", newAccessToken, {
    httpOnly: true,
    expires: new Date(Date.now() + 20 * 60 * 1000),
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken: newAccessToken }, "Token generated"),
    );
});

// forgotpassowrdrequest
const passwordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Invalid Email");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found by email");
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    await user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordTokenExpiry = tokenExpiry;

  await user.save();

  const resetPasswordUrl = `${process.env.BASE_URL}${apiV1}users/reset-password/${unHashedToken}`;

  const mailContent = forgotPasswordMailGenContent(
    user.username,
    resetPasswordUrl,
  );

  sendMail({
    email: user.email,
    subject: "Password Reset",
    mailGenContent: mailContent,
  });

  res.status(200).json(new ApiResponse(200, "Password reset email send"));
});

// changepassword
const changepassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!token || !password || !confirmPassword || password !== confirmPassword) {
    throw new ApiError(400, "Invaild request");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordTokenExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(401, "Invalid token");
  }

  user.password = password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordTokenExpiry = undefined;

  await user.save();

  res.status(200).json(new ApiResponse(200, "Password changed Successfully"));
});
// getcurrentUserprofile
export {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  resendVerificationEmail,
  passwordReset,
  refreshAccessTokenCheck,
  changepassword,
};
