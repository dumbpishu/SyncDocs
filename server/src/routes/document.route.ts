import express from "express";
import { createDocument, getUserDocuments, getDocumentById, updateDocument, deleteDocument } from "../controllers/document.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createDocument);
router.get("/", getUserDocuments);
router.get("/:id", getDocumentById);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

export default router;