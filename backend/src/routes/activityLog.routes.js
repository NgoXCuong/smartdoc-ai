import express from "express";
import { getActivityLogs } from "../controllers/activityLog.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.route("/")
  .get(getActivityLogs);

export default router;
