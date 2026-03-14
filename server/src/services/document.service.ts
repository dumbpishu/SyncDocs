import { Document } from "../models/document.model";

export const createDocumentService = async (ownerId: string, title?: string) => {
    const document = await Document.create({ owner: ownerId, title });
    return document;
}

export const getUserDocumentsService = async (userId: string) => {
    const documents = await Document.find({ $or: [ { owner: userId }, { "collaborators.user": userId } ], isDeleted: false }).sort({ updatedAt: -1 });
    return documents;
}

export const getDocumentByIdService = async (documentId: string, userId: string) => {
    const document = await Document.findOne({ _id: documentId, isDeleted: false, $or: [ { owner: userId }, { "collaborators.user": userId } ] }).populate("owner", "email username").populate("collaborators.user", "email username");
    return document;
}

export const updateDocumentService = async (documentId: string, data: any) => {
    const document = await Document.findByIdAndUpdate(documentId, { ...data, $inc: { version: 1 } }, { new: true }).populate("owner", "email username").populate("collaborators.user", "email username");
    return document;
}

export const deleteDocumentService = async (documentId: string, userId: string) => {
    const document = await Document.findByIdAndUpdate({ _id: documentId, owner: userId }, { isDeleted: true }, { new: true });
    return document;
}