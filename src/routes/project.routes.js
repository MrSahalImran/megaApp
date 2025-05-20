import { Router } from "express";
import { getProjects } from "../controllers/project.controllers.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/projects", isLoggedIn, getProjects);

export default router;
