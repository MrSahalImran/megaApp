import express from "express";
import healthCheckRouter from "./routes/healthcheck.routes.js";
import { apiV1 } from "./utils/constants.js";
import userRouter from "./routes/auth.routes.js";
import projectRouter from "./routes/project.routes.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(`${apiV1}healthcheck`, healthCheckRouter);
app.use(`${apiV1}users`, userRouter);
app.use(`${apiV1}project`, projectRouter);

export default app;
