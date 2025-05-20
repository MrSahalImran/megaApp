import { ApiResponse } from "../utils/apiResponse.js";

const healthCheck = async (req, res) => {
  res.status(200).json(new ApiResponse(200, { message: "Server is running" }));
};

export { healthCheck };
