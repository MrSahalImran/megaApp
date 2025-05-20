import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/async-handler.js";

// getprojects
const getProjects = asyncHandler(async (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      project1: { id: 1, name: "abc" },
      project2: { id: 2, name: "def" },
    }),
  );
});
// getprojectby id
// createproject
// updateproject
// deleteproject
// addMembertoproject
// removeMembertoproject
// getmember
// updatemember
// updatemember role
// delete member

export { getProjects };
