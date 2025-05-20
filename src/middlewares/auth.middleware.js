import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

const isLoggedIn = asyncHandler(async (req, _res, next) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    throw new ApiError(401, "Authentication Failed");
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Invalid or expired token");
  }
  const id = decodedToken._id;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  req.user = {
    id: user._id,
    email: user.email,
  };
  next();
});

export { isLoggedIn };
