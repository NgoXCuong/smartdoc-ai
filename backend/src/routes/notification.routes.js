import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notification.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.route("/")
  .get(getNotifications);

router.route("/read-all")
  .put(markAllAsRead)
  .patch(markAllAsRead);

router.route("/:id/read")
  .put(markAsRead)
  .patch(markAsRead);

router.route("/:id")
  .delete(deleteNotification);

export default router;
