import express from "express";
import multer from "multer";
import * as BuildingDocumentationController from "../controllers/buildingDocumentation.controller.js";
import {
  authMiddleware,
  canViewAset,
  permissionMiddleware,
  PERMISSIONS,
} from "../middleware/auth.middleware.js";
import { documentationMediaMetadata } from "../utils/buildingDocumentation.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const valid = Boolean(documentationMediaMetadata(file));
    callback(valid ? null : new Error("Format harus JPG, PNG, WebP, GIF, MP4, MOV, atau WebM"), valid);
  },
});

const receiveUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    const isLimit = error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
    return res.status(isLimit ? 413 : 400).json({
      success: false,
      error: isLimit ? "Ukuran file maksimal 200 MB" : error.message,
    });
  });
};

router.use(authMiddleware);
router.get("/buildings", canViewAset, BuildingDocumentationController.listBuildings);
router.get("/", canViewAset, BuildingDocumentationController.list);
router.post(
  "/",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  receiveUpload,
  BuildingDocumentationController.create,
);
router.delete(
  "/:id",
  permissionMiddleware(PERMISSIONS.ASET_UPDATE),
  BuildingDocumentationController.remove,
);

export default router;
