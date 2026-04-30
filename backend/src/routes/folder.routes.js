import express from "express";
import { 
  createFolder, 
  getFolders, 
  updateFolder, 
  deleteFolder,
  moveDocument 
} from "../controllers/folder.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.route("/")
  .get(getFolders)
  .post(createFolder);

router.route("/move")
  .post(moveDocument);

router.route("/:folderId")
  .patch(updateFolder)
  .delete(deleteFolder);

export default router;
