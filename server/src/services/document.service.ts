import { Document } from "../models/document.model";
import { User } from "../models/user.model";
import { AppError } from "../utils/appError";

type CollaboratorRole = "editor" | "viewer";

type UpdateDocumentPayload = {
    title?: string;
    content?: string;
};

const baseDocumentQuery = { isDeleted: false };
const documentPopulation = [
    { path: "owner", select: "email username avatar" },
    { path: "collaborators.user", select: "email username avatar" }
] as const;

const populateDocument = <T>(query: T) => {
    return (query as any).populate(documentPopulation);
};

const isSameUser = (left: string, right: string) => left.toString() === right.toString();

const getDocumentAccess = (document: any, userId: string) => {
    const isOwner = isSameUser(document.owner, userId);
    const collaborator = document.collaborators.find((entry: any) => entry.user?.toString() === userId);

    return {
        isOwner,
        collaborator,
        canEdit: isOwner || collaborator?.role === "editor",
        canView: isOwner || Boolean(collaborator)
    };
};

const findActiveDocumentById = (documentId: string) =>
    Document.findOne({ _id: documentId, ...baseDocumentQuery });

const findOwnedActiveDocumentById = (documentId: string, ownerId: string) =>
    Document.findOne({ _id: documentId, owner: ownerId, ...baseDocumentQuery });

const buildSharedDocumentsByRole = (documents: any[], userId: string) => ({
    editor: documents.filter((document) =>
        document.collaborators.some((entry: any) => entry.user?._id?.toString() === userId && entry.role === "editor")
    ),
    viewer: documents.filter((document) =>
        document.collaborators.some((entry: any) => entry.user?._id?.toString() === userId && entry.role === "viewer")
    )
});

export const createDocumentService = async (ownerId: string, title?: string, content?: string) => {
    const document = await Document.create({ owner: ownerId, title, content });
    return populateDocument(Document.findById(document._id)).orFail();
};

export const getOwnedDocumentsService = async (userId: string) => {
    const documents = await populateDocument(
        Document.find({ owner: userId, ...baseDocumentQuery }).sort({ updatedAt: -1 })
    );

    return documents;
};

export const getSharedDocumentsService = async (userId: string) => {
    const documents = await populateDocument(
        Document.find({ "collaborators.user": userId, ...baseDocumentQuery }).sort({ updatedAt: -1 })
    );

    return buildSharedDocumentsByRole(documents, userId);
};

export const getUserDocumentsService = async (userId: string) => {
    const [ownedDocuments, sharedDocuments] = await Promise.all([
        getOwnedDocumentsService(userId),
        getSharedDocumentsService(userId)
    ]);

    return { ownedDocuments, sharedDocuments };
};

export const getDocumentByIdService = async (documentId: string, userId: string) => {
    const document = await populateDocument(
        Document.findOne({
            _id: documentId,
            ...baseDocumentQuery,
            $or: [{ owner: userId }, { "collaborators.user": userId }]
        })
    );

    return document;
};

export const updateDocumentService = async (documentId: string, userId: string, data: UpdateDocumentPayload) => {
    const document = await findActiveDocumentById(documentId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    const access = getDocumentAccess(document, userId);

    if (!access.canView) {
        throw new AppError(403, "You do not have access to this document");
    }

    if (!access.canEdit) {
        throw new AppError(403, "You do not have permission to edit this document");
    }

    if (data.title !== undefined) {
        document.title = data.title;
    }

    if (data.content !== undefined) {
        document.content = data.content;
    }

    document.version += 1;
    await document.save();

    return populateDocument(Document.findById(document._id)).orFail();
};

export const deleteDocumentService = async (documentId: string, userId: string) => {
    const document = await Document.findOneAndUpdate(
        { _id: documentId, owner: userId, ...baseDocumentQuery },
        { isDeleted: true },
        { new: true }
    );

    return document;
};

export const addCollaboratorService = async (documentId: string, ownerId: string, email: string, role: CollaboratorRole) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new AppError(404, "User not found");
    }

    const document = await findOwnedActiveDocumentById(documentId, ownerId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    if (isSameUser(document.owner.toString(), user._id.toString())) {
        throw new AppError(400, "Owner is already part of the document");
    }

    if (document.collaborators.some((entry) => entry.user && isSameUser(entry.user.toString(), user._id.toString()))) {
        throw new AppError(409, "User is already a collaborator");
    }

    document.collaborators.push({ user: user._id, role });
    document.version += 1;
    await document.save();

    return populateDocument(Document.findById(document._id)).orFail();
};

export const removeCollaboratorService = async (documentId: string, ownerId: string, collaboratorId: string) => {
    const document = await findOwnedActiveDocumentById(documentId, ownerId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    const collaborator = document.collaborators.find((entry) => entry.user && isSameUser(entry.user.toString(), collaboratorId));

    if (!collaborator) {
        throw new AppError(404, "Collaborator not found");
    }

    document.collaborators.pull({ user: collaboratorId });
    document.version += 1;
    await document.save();

    return populateDocument(Document.findById(document._id)).orFail();
};

export const updateCollaboratorRoleService = async (
    documentId: string,
    ownerId: string,
    collaboratorId: string,
    role: CollaboratorRole
) => {
    const document = await findOwnedActiveDocumentById(documentId, ownerId);

    if (!document) {
        throw new AppError(404, "Document not found");
    }

    const collaborator = document.collaborators.find((entry) => entry.user && isSameUser(entry.user.toString(), collaboratorId));

    if (!collaborator) {
        throw new AppError(404, "Collaborator not found");
    }

    collaborator.role = role;
    document.version += 1;
    await document.save();
    return populateDocument(Document.findById(document._id)).orFail();
};
