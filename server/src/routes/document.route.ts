import express from "express";
import {
    addCollaborator,
    createDocument,
    deleteDocument,
    getDocumentById,
    getOwnedDocuments,
    getSharedDocuments,
    getUserDocuments,
    removeCollaborator,
    updateCollaboratorRole,
    updateDocument
} from "../controllers/document.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validateRequest } from "../middlewares/validate.middleware";
import {
    addCollaboratorSchema,
    createDocumentSchema,
    removeCollaboratorSchema,
    updateCollaboratorSchema,
    updateDocumentSchema
} from "../validations/document.validation";

const router = express.Router();

router.use(authMiddleware);

router.post("/", validateRequest(createDocumentSchema), createDocument);
router.get("/", getUserDocuments);
router.get("/owned", getOwnedDocuments);
router.get("/shared", getSharedDocuments);
router.get("/:id", getDocumentById);
router.put("/:id", validateRequest(updateDocumentSchema), updateDocument);
router.delete("/:id", deleteDocument);

router.post("/:id/collaborators", validateRequest(addCollaboratorSchema), addCollaborator);
router.delete("/:id/collaborators", validateRequest(removeCollaboratorSchema), removeCollaborator);
router.delete("/:id/collaborators/:collaboratorId", removeCollaborator);
router.put("/:id/collaborators", validateRequest(updateCollaboratorSchema), updateCollaboratorRole);
router.patch("/:id/collaborators/:collaboratorId", validateRequest(updateCollaboratorSchema), updateCollaboratorRole);

export default router;
