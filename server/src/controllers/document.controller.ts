import { Request, Response } from 'express';
import { createDocumentService, getUserDocumentsService, getDocumentByIdService, updateDocumentService, deleteDocumentService } from '../services/document.service';

// Extend Express Request interface to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: {
                _id: string;
                // add other user properties if needed
            };
        }
    }
}

export const createDocument = async (req: Request, res: Response) => {
    try {
        const { title } = req.body;
        const ownerId = req.user!._id;

        const document = await createDocumentService(ownerId, title);

        return res.status(201).json(document);
    } catch (error) {
        return res.status(500).json({ message: "Failed to create document" });
    }
}

export const getUserDocuments = async (req: Request, res: Response) => {
    try {
        const userId = req.user!._id;

        const documents = await getUserDocumentsService(userId);

        return res.status(200).json(documents);
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch documents" });
    }
}

export const getDocumentById = async (req: Request, res: Response) => {
    try {
        let id = req.params.id;
        const userId = req.user!._id;

        if (Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid document ID" });
        }

        const document = await getDocumentByIdService(id, userId);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return res.status(200).json(document);

    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch document" });
    }
}

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const updateData = req.body;

        if (Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid document ID" });
        }

        const document = await updateDocumentService(id, updateData);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return res.status(200).json(document);
    } catch (error) {
        return res.status(500).json({ message: "Failed to update document" });
    }
}

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.user!._id;

        if (Array.isArray(id)) {
            return res.status(400).json({ message: "Invalid document ID" });
        }

        const document = await deleteDocumentService(id, userId);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        return res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Failed to delete document" });
    }
}