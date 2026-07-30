import express from "express";
import { 
  createFolder, 
  getFolders, 
  getFolder,
  getFolderBreadcrumbs,
  updateFolder, 
  deleteFolder,
  moveFolder,
  moveDocument,
  shareFolder,
  removeFolderShare
} from "../controllers/folder.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.route("/")
  .get(getFolders)
  .post(createFolder);

router.route("/move")
  .post(moveDocument);

router.route("/move-folder")
  .post(moveFolder);

router.route("/:folderId")
  .get(getFolder)
  .patch(updateFolder)
  .delete(deleteFolder);

router.route("/:folderId/breadcrumbs")
  .get(getFolderBreadcrumbs);

router.route("/:folderId/share")
  .post(shareFolder);

router.route("/:folderId/share/:email")
  .delete(removeFolderShare);

export default router;
