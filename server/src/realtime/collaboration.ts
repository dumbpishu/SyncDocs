import { Server } from "socket.io";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { User } from "../models/user.model";
import { Document } from "../models/document.model";

type AuthenticatedUser = {
    _id: string;
    email?: string;
    username?: string;
};

type Participant = {
    socketId: string;
    userId: string;
    username: string;
    email: string;
    color: string;
};

type CursorPosition = {
    userId: string;
    username: string;
    color: string;
    x: number;
    y: number;
    height: number;
};

type PendingDocumentUpdate = {
    content: string;
    title?: string;
};

const participantPalette = [
    "#2563eb",
    "#059669",
    "#dc2626",
    "#7c3aed",
    "#d97706",
    "#0f766e",
];

const roomParticipants = new Map<string, Map<string, Participant>>();
const roomCursors = new Map<string, Map<string, CursorPosition>>();
const pendingDocumentUpdates = new Map<string, PendingDocumentUpdate>();
const saveTimers = new Map<string, NodeJS.Timeout>();

const getRoomName = (documentId: string) => `document:${documentId}`;

const getParticipantColor = (userId: string) => {
    const charTotal = userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return participantPalette[charTotal % participantPalette.length];
};

const getAccessTokenFromHandshake = (socket: any) => {
    const parsedCookie = cookie.parse(socket.handshake.headers.cookie || "");
    const bearerToken = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];
    return parsedCookie.accessToken || bearerToken;
};

const getDocumentAccess = async (documentId: string, userId: string) => {
    const document = await Document.findOne({
        _id: documentId,
        isDeleted: false,
        $or: [{ owner: userId }, { "collaborators.user": userId }],
    });

    if (!document) {
        return null;
    }

    const collaborator = document.collaborators.find((entry) => entry.user?.toString() === userId);

    return {
        document,
        canEdit: document.owner.toString() === userId || collaborator?.role === "editor",
        role: document.owner.toString() === userId ? "owner" : collaborator?.role ?? "viewer",
    };
};

const getRoomSnapshot = (documentId: string) => ({
    participants: Array.from(roomParticipants.get(documentId)?.values() ?? []),
    cursors: Array.from(roomCursors.get(documentId)?.values() ?? []),
});

const broadcastPresence = (io: Server, documentId: string) => {
    io.to(getRoomName(documentId)).emit("presence:update", getRoomSnapshot(documentId));
};

const removeSocketFromDocumentRoom = (io: Server, socket: any) => {
    const activeDocumentId = socket.data.activeDocumentId as string | undefined;
    const user = socket.data.user as AuthenticatedUser | undefined;

    if (!activeDocumentId || !user) {
        return;
    }

    socket.leave(getRoomName(activeDocumentId));
    socket.data.activeDocumentId = undefined;

    const participants = roomParticipants.get(activeDocumentId);
    participants?.delete(socket.id);
    if (participants && participants.size === 0) {
        roomParticipants.delete(activeDocumentId);
    }

    const cursors = roomCursors.get(activeDocumentId);
    cursors?.delete(user._id);
    if (cursors && cursors.size === 0) {
        roomCursors.delete(activeDocumentId);
    }

    broadcastPresence(io, activeDocumentId);
};

const scheduleDocumentSave = (documentId: string) => {
    const existingTimer = saveTimers.get(documentId);
    if (existingTimer) {
        clearTimeout(existingTimer);
    }

    const nextTimer = setTimeout(async () => {
        const pendingUpdate = pendingDocumentUpdates.get(documentId);

        if (!pendingUpdate) {
            saveTimers.delete(documentId);
            return;
        }

        await Document.findOneAndUpdate(
            { _id: documentId, isDeleted: false },
            {
                content: pendingUpdate.content,
                ...(pendingUpdate.title !== undefined ? { title: pendingUpdate.title } : {}),
                $inc: { version: 1 },
            }
        );

        pendingDocumentUpdates.delete(documentId);
        saveTimers.delete(documentId);
    }, 1000);

    saveTimers.set(documentId, nextTimer);
};

export const registerCollaborationServer = (httpServer: ReturnType<typeof createServer>) => {
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173"],
            credentials: true,
        },
    });

    io.use(async (socket, next) => {
        try {
            const accessToken = getAccessTokenFromHandshake(socket);

            if (!accessToken) {
                return next(new Error("Unauthorized"));
            }

            const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET!) as { id: string };
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error("Unauthorized"));
            }

            socket.data.user = {
                _id: user._id.toString(),
                email: typeof user.email === "string" ? user.email : undefined,
                username: user.username,
            } satisfies AuthenticatedUser;

            return next();
        } catch (error) {
            return next(new Error("Unauthorized"));
        }
    });

    io.on("connection", (socket) => {
        socket.on("document:join", async ({ documentId }: { documentId: string }) => {
            const user = socket.data.user as AuthenticatedUser;

            removeSocketFromDocumentRoom(io, socket);

            const access = await getDocumentAccess(documentId, user._id);

            if (!access) {
                socket.emit("document:error", { message: "You do not have access to this document" });
                return;
            }

            socket.join(getRoomName(documentId));
            socket.data.activeDocumentId = documentId;

            const participant: Participant = {
                socketId: socket.id,
                userId: user._id,
                username: user.username || user.email || "Anonymous",
                email: user.email || "",
                color: getParticipantColor(user._id),
            };

            const participants = roomParticipants.get(documentId) ?? new Map<string, Participant>();
            participants.set(socket.id, participant);
            roomParticipants.set(documentId, participants);

            const cursors = roomCursors.get(documentId) ?? new Map<string, CursorPosition>();
            roomCursors.set(documentId, cursors);

            socket.emit("document:bootstrap", {
                documentId,
                content: access.document.content || "",
                title: access.document.title,
                version: access.document.version,
                role: access.role,
                ...getRoomSnapshot(documentId),
            });

            broadcastPresence(io, documentId);
        });

        socket.on(
            "document:update",
            async ({ documentId, content }: { documentId: string; content: string }) => {
                const user = socket.data.user as AuthenticatedUser;
                const access = await getDocumentAccess(documentId, user._id);

                if (!access || !access.canEdit) {
                    socket.emit("document:error", { message: "You do not have permission to edit this document" });
                    return;
                }

                pendingDocumentUpdates.set(documentId, { content });
                scheduleDocumentSave(documentId);

                socket.to(getRoomName(documentId)).emit("document:update", {
                    documentId,
                    content,
                    updatedBy: user._id,
                });
            }
        );

        socket.on(
            "document:title:update",
            async ({ documentId, title }: { documentId: string; title: string }) => {
                const user = socket.data.user as AuthenticatedUser;
                const access = await getDocumentAccess(documentId, user._id);

                if (!access || !access.canEdit) {
                    socket.emit("document:error", { message: "You do not have permission to edit this document" });
                    return;
                }

                const pendingUpdate = pendingDocumentUpdates.get(documentId) ?? {
                    content: access.document.content || "",
                };

                pendingDocumentUpdates.set(documentId, {
                    ...pendingUpdate,
                    title,
                });
                scheduleDocumentSave(documentId);

                socket.to(getRoomName(documentId)).emit("document:title:update", {
                    documentId,
                    title,
                    updatedBy: user._id,
                });
            }
        );

        socket.on(
            "cursor:update",
            ({ documentId, cursor }: { documentId: string; cursor: Omit<CursorPosition, "userId" | "username" | "color"> | null }) => {
                const user = socket.data.user as AuthenticatedUser;
                const participants = roomParticipants.get(documentId);
                const currentParticipant = participants?.get(socket.id);

                if (!currentParticipant) {
                    return;
                }

                const cursors = roomCursors.get(documentId) ?? new Map<string, CursorPosition>();

                if (!cursor) {
                    cursors.delete(user._id);
                } else {
                    cursors.set(user._id, {
                        userId: user._id,
                        username: currentParticipant.username,
                        color: currentParticipant.color,
                        x: cursor.x,
                        y: cursor.y,
                        height: cursor.height,
                    });
                }

                roomCursors.set(documentId, cursors);
                broadcastPresence(io, documentId);
            }
        );

        socket.on("document:leave", () => {
            removeSocketFromDocumentRoom(io, socket);
        });

        socket.on("disconnect", () => {
            removeSocketFromDocumentRoom(io, socket);
        });
    });

    return io;
};
