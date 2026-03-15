import { Request, Response } from 'express';
import {
    addCollaboratorService,
    createDocumentService,
    deleteDocumentService,
    getDocumentByIdService,
    getOwnedDocumentsService,
    getSharedDocumentsService,
    getUserDocumentsService,
    removeCollaboratorService,
    updateCollaboratorRoleService,
    updateDocumentService
} from '../services/document.service';
import { getErrorResponse } from '../utils/controller';
import { sendErrorResponse, sendSuccessResponse } from '../utils/apiResponse';

export const createDocument = async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body;
        const ownerId = req.user!._id;

        const document = await createDocumentService(ownerId, title, content);

        return sendSuccessResponse(res, {
            statusCode: 201,
            message: "Document created successfully",
            data: { document }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to create document");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const getUserDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user!._id;

        const documents = await getUserDocumentsService(userId);

        return sendSuccessResponse(res, {
            message: "Documents fetched successfully",
            data: documents
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to fetch documents");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const getOwnedDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user!._id;
        const documents = await getOwnedDocumentsService(userId);

        return sendSuccessResponse(res, {
            message: "Owned documents fetched successfully",
            data: { documents }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to fetch owned documents");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const getSharedDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user!._id;
        const documents = await getSharedDocumentsService(userId);

        return sendSuccessResponse(res, {
            message: "Shared documents fetched successfully",
            data: documents
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to fetch shared documents");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const getDocumentById = async (req: Request, res: Response) => {
    try {
        let id = req.params.id;
        const userId = req.user!._id;

        if (Array.isArray(id)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const document = await getDocumentByIdService(id, userId);

        if (!document) {
            return sendErrorResponse(res, {
                statusCode: 404,
                message: "Document not found"
            });
        }

        return sendSuccessResponse(res, {
            message: "Document fetched successfully",
            data: { document }
        });

    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to fetch document");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const updateData = req.body;
        const userId = req.user!._id;

        if (Array.isArray(id)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const document = await updateDocumentService(id, userId, updateData);

        return sendSuccessResponse(res, {
            message: "Document updated successfully",
            data: { document }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to update document");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.user!._id;

        if (Array.isArray(id)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const document = await deleteDocumentService(id, userId);

        if (!document) {
            return sendErrorResponse(res, {
                statusCode: 404,
                message: "Document not found"
            });
        }

        return sendSuccessResponse(res, {
            message: "Document deleted successfully"
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to delete document");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const addCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.id;

        if (Array.isArray(documentId)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const ownerId = req.user!._id;
        const { email, role } = req.body;

        const document = await addCollaboratorService(documentId, ownerId, email, role);

        return sendSuccessResponse(res, {
            message: "Collaborator added successfully",
            data: { document }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to add collaborator");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const removeCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.id;

        if (Array.isArray(documentId)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const ownerId = req.user!._id;
        const collaboratorId = req.params.collaboratorId || req.body.collaboratorId;

        const document = await removeCollaboratorService(documentId, ownerId, collaboratorId);

        return sendSuccessResponse(res, {
            message: "Collaborator removed successfully",
            data: { document }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to remove collaborator");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};

export const updateCollaboratorRole = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.id;

        if (Array.isArray(documentId)) {
            return sendErrorResponse(res, {
                statusCode: 400,
                message: "Invalid document ID"
            });
        }

        const ownerId = req.user!._id;
        const collaboratorId = req.params.collaboratorId || req.body.collaboratorId;
        const { role } = req.body;
        const document = await updateCollaboratorRoleService(documentId, ownerId, collaboratorId, role);

        return sendSuccessResponse(res, {
            message: "Collaborator role updated successfully",
            data: { document }
        });
    } catch (error) {
        const { statusCode, message, errors } = getErrorResponse(error, "Failed to update collaborator role");
        return sendErrorResponse(res, { statusCode, message, errors });
    }
};
