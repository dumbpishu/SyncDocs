import { Document } from "../models/document.model";
import { User } from "../models/user.model";

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
    const document = await Document.findByIdAndUpdate({ _id: documentId }, { ...data, $inc: { version: 1 } }, { new: true }).populate("owner", "email username").populate("collaborators.user", "email username");
    return document;
}

export const deleteDocumentService = async (documentId: string, userId: string) => {
    const document = await Document.findOneAndUpdate({ _id: documentId, owner: userId }, { isDeleted: true }, { new: true });
    return document;
}

export const addCollaboratorService = async (documentId: string, ownerId: string, email: string, role: string) => {
    const user = await User.findOne({ email });

    if (!user) {
        throw new Error("User not found");
    }

    const document = await Document.findOne({ _id: documentId, owner: ownerId });

    if (!document) {
        throw new Error("Document not found or you don't have permission to add collaborators");
    }

    if (document.collaborators.some(c => c.user && c.user.toString() === user._id.toString())) {
        throw new Error("User is already a collaborator");
    }

    document.collaborators.push({ user: user._id, role });
    await document.save();

    return document.populate("collaborators.user", "email username");
}

export const removeCollaboratorService = async (documentId: string, ownerId: string, collaboratorId: string) => {
    const document = await Document.findOne({ _id: documentId, owner: ownerId });

    if (!document) {
        throw new Error("Document not found or you don't have permission to remove collaborators");
    }

    document.collaborators.pull({ user: collaboratorId });
    await document.save();

    return document.populate("collaborators.user", "email username");
}

export const updateCollaboratorRoleService = async (
    documentId: string,
    ownerId: string,
    collaboratorId: string,
    role: "editor" | "viewer"
) => {
    const document = await Document.findOne({ _id: documentId, owner: ownerId });
    if (!document) {
        throw new Error("Document not found or you don't have permission to update collaborators");
    }

    const collaborator = document.collaborators.find(c => c.user && c.user.toString() === collaboratorId);

    if (!collaborator) {
        throw new Error("Collaborator not found");
    }

    collaborator.role = role;
    await document.save();
    return document.populate("collaborators.user", "email username");
}