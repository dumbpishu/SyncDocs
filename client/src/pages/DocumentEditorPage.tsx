import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  addCollaborator,
  deleteDocument,
  getDocumentById,
  removeCollaborator,
  updateCollaboratorRole,
} from "../api/document.api";
import { CollaborativeLexicalEditor } from "../components/editor/CollaborativeLexicalEditor";
import { useAuth } from "../context/AuthContext";
import { getCollaborationSocket } from "../services/realtime";
import type {
  Collaborator,
  CollaboratorRole,
  DocumentRecord,
  OnlineParticipant,
  RemoteCursor,
} from "../types/document";
import { getApiErrorMessage } from "../utils/api";

export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useMemo(() => getCollaborationSocket(), []);
  const updateDebounceRef = useRef<number | null>(null);
  const titleBroadcastRef = useRef<number | null>(null);
  const lastBroadcastedTitleRef = useRef("");

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [serializedContent, setSerializedContent] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("viewer");
  const [participants, setParticipants] = useState<OnlineParticipant[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  const isOwner = document?.owner?._id === user?._id;
  const currentCollaborator = document?.collaborators.find(
    (collaborator) => collaborator.user?._id === user?._id,
  );
  const canEdit = Boolean(document && (isOwner || currentCollaborator?.role === "editor"));

  const loadDocument = async (documentId: string) => {
    try {
      setIsLoading(true);
      const nextDocument = await getDocumentById(documentId);

      if (!nextDocument) {
        setError("Document not found.");
        return;
      }

      setDocument(nextDocument);
      setTitleDraft(nextDocument.title);
      lastBroadcastedTitleRef.current = nextDocument.title;
      setSerializedContent(nextDocument.content ?? "");
      setError("");
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "We couldn't load this document right now."));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate("/dashboard", { replace: true });
      return;
    }

    void loadDocument(id);
  }, [id, navigate]);

  useEffect(() => {
    socket.connect();

    const handleBootstrap = (payload: {
      documentId: string;
      content: string;
      participants: OnlineParticipant[];
      cursors: RemoteCursor[];
      version: number;
      title: string;
    }) => {
      if (payload.documentId !== id) {
        return;
      }

      setParticipants(payload.participants);
      setRemoteCursors(payload.cursors.filter((cursor) => cursor.userId !== user?._id));
      setSerializedContent(payload.content ?? "");
      setTitleDraft(payload.title ?? "");
      lastBroadcastedTitleRef.current = payload.title ?? "";
      setDocument((currentDocument) =>
        currentDocument
          ? {
              ...currentDocument,
              content: payload.content ?? "",
              version: payload.version ?? currentDocument.version,
              title: payload.title ?? currentDocument.title,
            }
          : currentDocument,
      );
    };

    const handlePresenceUpdate = (payload: {
      participants: OnlineParticipant[];
      cursors: RemoteCursor[];
    }) => {
      setParticipants(payload.participants);
      setRemoteCursors(payload.cursors.filter((cursor) => cursor.userId !== user?._id));
    };

    const handleRemoteUpdate = (payload: { documentId: string; content: string }) => {
      if (payload.documentId !== id) {
        return;
      }

      setSerializedContent(payload.content ?? "");
      setDocument((currentDocument) =>
        currentDocument ? { ...currentDocument, content: payload.content ?? "" } : currentDocument,
      );
    };

    const handleRemoteTitleUpdate = (payload: { documentId: string; title: string }) => {
      if (payload.documentId !== id) {
        return;
      }

      setTitleDraft(payload.title ?? "");
      lastBroadcastedTitleRef.current = payload.title ?? "";
      setDocument((currentDocument) =>
        currentDocument ? { ...currentDocument, title: payload.title ?? "" } : currentDocument,
      );
    };

    const handleRealtimeError = (payload: { message: string }) => {
      setError(payload.message);
    };

    socket.on("document:bootstrap", handleBootstrap);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("document:update", handleRemoteUpdate);
    socket.on("document:title:update", handleRemoteTitleUpdate);
    socket.on("document:error", handleRealtimeError);

    return () => {
      socket.emit("document:leave");
      socket.off("document:bootstrap", handleBootstrap);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("document:update", handleRemoteUpdate);
      socket.off("document:title:update", handleRemoteTitleUpdate);
      socket.off("document:error", handleRealtimeError);
      socket.disconnect();
    };
  }, [id, socket, user?._id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    socket.emit("document:join", { documentId: id });

    return () => {
      socket.emit("document:leave");
      setParticipants([]);
      setRemoteCursors([]);
    };
  }, [id, socket]);

  const handleRealtimeContentChange = (nextSerializedContent: string) => {
    if (!id) {
      return;
    }

    setSerializedContent(nextSerializedContent);
    setSaveState("saving");
    setDocument((currentDocument) =>
      currentDocument ? { ...currentDocument, content: nextSerializedContent } : currentDocument,
    );

    if (updateDebounceRef.current) {
      window.clearTimeout(updateDebounceRef.current);
    }

    updateDebounceRef.current = window.setTimeout(() => {
      socket.emit("document:update", {
        documentId: id,
        content: nextSerializedContent,
      });
      setSaveState("saved");
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 1000);
  };

  useEffect(() => {
    if (!id || !document) {
      return;
    }

    const normalizedTitle = titleDraft.trim() || "Untitled Document";

    if (normalizedTitle === lastBroadcastedTitleRef.current) {
      return;
    }

    setSaveState("saving");

    if (titleBroadcastRef.current) {
      window.clearTimeout(titleBroadcastRef.current);
    }

    titleBroadcastRef.current = window.setTimeout(() => {
      socket.emit("document:title:update", {
        documentId: id,
        title: normalizedTitle,
      });
      lastBroadcastedTitleRef.current = normalizedTitle;
      setSaveState("saved");
      setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 1000);

    return () => {
      if (titleBroadcastRef.current) {
        window.clearTimeout(titleBroadcastRef.current);
      }
    };
  }, [document, id, socket, titleDraft]);

  const handleCursorChange = (cursor: { x: number; y: number; height: number } | null) => {
    if (!id) {
      return;
    }

    socket.emit("cursor:update", { documentId: id, cursor });
  };

  const handleDeleteDocument = async () => {
    if (!id || !isOwner) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteDocument(id);
      navigate("/dashboard", { replace: true });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete this document."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!id || !isOwner || !inviteEmail.trim()) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedDocument = await addCollaborator(id, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      if (updatedDocument) {
        setDocument(updatedDocument);
      }

      setInviteEmail("");
      setNotice("Collaborator added.");
    } catch (inviteError) {
      setError(getApiErrorMessage(inviteError, "Unable to add collaborator."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (collaboratorId: string, role: CollaboratorRole) => {
    if (!id || !isOwner) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedDocument = await updateCollaboratorRole(id, collaboratorId, role);
      if (updatedDocument) {
        setDocument(updatedDocument);
      }
    } catch (roleError) {
      setError(getApiErrorMessage(roleError, "Unable to update collaborator role."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!id || !isOwner) {
      return;
    }

    try {
      setIsSaving(true);
      const updatedDocument = await removeCollaborator(id, collaboratorId);
      if (updatedDocument) {
        setDocument(updatedDocument);
      }
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, "Unable to remove collaborator."));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4">
          <div className="h-16 animate-pulse rounded-[1.25rem] bg-[#ececea]" />
          <div className="h-[540px] animate-pulse rounded-[1.25rem] bg-[#ececea]" />
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <p className="text-2xl font-semibold text-[#191919]">Document not available</p>
        <p className="mt-3 text-sm text-[#6b6b6b]">This document could not be loaded or you may not have access.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-[#191919] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f]"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-5">
          <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-5 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Link to="/dashboard" className="text-sm text-[#6b6b6b] transition hover:text-[#191919]">
                  Back to dashboard
                </Link>
                <input
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  disabled={!canEdit}
                  className="mt-3 w-full border-none bg-transparent p-0 text-4xl font-semibold tracking-tight text-[#191919] outline-none disabled:opacity-70"
                  placeholder="Untitled Document"
                />
                <p className="mt-2 text-sm text-[#6b6b6b]">
                  {participants.length} online - Version {document.version} - Autosaves every 1 second{lastSyncedAt ? ` - Last synced ${lastSyncedAt}` : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="rounded-full bg-[#efefed] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f5e5b]">
                  {saveState === "saving" ? "Autosaving" : "Autosaved"}
                </span>
                {isOwner ? (
                  <button
                    onClick={handleDeleteDocument}
                    disabled={isSaving}
                    className="rounded-xl bg-[#191919] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] disabled:opacity-60"
                  >
                    Delete
                  </button>
                ) : null}
              </div>
            </div>

            {notice ? <InlineMessage>{notice}</InlineMessage> : null}
            {error ? <InlineMessage>{error}</InlineMessage> : null}
          </div>

          <div className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-4 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <CollaborativeLexicalEditor
              key={document._id}
              documentId={document._id}
              serializedContent={serializedContent}
              canEdit={canEdit}
              remoteCursors={remoteCursors}
              onSerializedChange={handleRealtimeContentChange}
              onCursorChange={handleCursorChange}
            />
          </div>
        </section>

        <aside className="space-y-4">
          <SideCard title="Realtime session" caption="Presence and live activity">
            <div className="space-y-3">
              {participants.length ? (
                participants.map((participant) => (
                  <div key={participant.socketId} className="flex items-center justify-between rounded-xl border border-black/8 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: participant.color }} />
                      <div>
                        <p className="text-sm font-semibold text-[#191919]">{participant.username}</p>
                        <p className="text-xs text-[#6b6b6b]">{participant.email || "Connected"}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[#6b6b6b]">
                      {remoteCursors.some((cursor) => cursor.userId === participant.userId) ? "Typing" : "Online"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#6b6b6b]">No one else is viewing this document right now.</p>
              )}
            </div>
          </SideCard>

          <SideCard title="Owner" caption="Document owner">
            <PersonLine
              name={document.owner.username}
              email={document.owner.email ?? ""}
              badge="Owner"
            />
          </SideCard>

          <SideCard title="Collaborators" caption="Access and roles">
            {document.collaborators.length ? (
              <div className="space-y-3">
                {document.collaborators.map((collaborator) => (
                  <CollaboratorRow
                    key={collaborator.user._id}
                    collaborator={collaborator}
                    canManage={Boolean(isOwner)}
                    onRoleChange={handleRoleChange}
                    onRemove={handleRemoveCollaborator}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6b6b6b]">No collaborators added yet.</p>
            )}
          </SideCard>

          {isOwner ? (
            <SideCard title="Invite collaborator" caption="Add editor or viewer access">
              <div className="space-y-3">
                <input
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#191919] outline-none transition focus:border-[#191919]"
                  placeholder="collaborator@example.com"
                />
                <select
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as CollaboratorRole)}
                  className="w-full rounded-xl border border-black/8 bg-white px-4 py-3 text-sm text-[#191919] outline-none transition focus:border-[#191919]"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <button
                  onClick={handleAddCollaborator}
                  disabled={isSaving}
                  className="w-full rounded-xl bg-[#191919] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] disabled:opacity-60"
                >
                  Add collaborator
                </button>
              </div>
            </SideCard>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function SideCard({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-[#fbfbfa] p-5 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
      <p className="text-sm font-semibold text-[#191919]">{title}</p>
      <p className="mt-1 text-sm text-[#6b6b6b]">{caption}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InlineMessage({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-black/8 bg-[#f1f1ef] px-4 py-3 text-sm text-[#3f3f3f]">
      {children}
    </div>
  );
}

function PersonLine({
  name,
  email,
  badge,
}: {
  name: string;
  email: string;
  badge: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-black/8 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#191919]">{name}</p>
        <p className="truncate text-sm text-[#6b6b6b]">{email}</p>
      </div>
      <span className="rounded-full bg-[#efefed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#5f5e5b]">
        {badge}
      </span>
    </div>
  );
}

function CollaboratorRow({
  collaborator,
  canManage,
  onRoleChange,
  onRemove,
}: {
  collaborator: Collaborator;
  canManage: boolean;
  onRoleChange: (collaboratorId: string, role: CollaboratorRole) => void;
  onRemove: (collaboratorId: string) => void;
}) {
  const collaboratorId = collaborator.user._id;

  return (
    <div className="rounded-xl border border-black/8 bg-white px-4 py-4">
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold text-[#191919]">{collaborator.user.username}</p>
          <p className="text-sm text-[#6b6b6b]">{collaborator.user.email ?? ""}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={collaborator.role}
            onChange={(event) => onRoleChange(collaboratorId, event.target.value as CollaboratorRole)}
            disabled={!canManage}
            className="rounded-full border border-black/8 bg-[#f7f7f5] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5e5b] outline-none transition focus:border-[#191919] disabled:opacity-60"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button
            onClick={() => onRemove(collaboratorId)}
            disabled={!canManage}
            className="rounded-full border border-black/8 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5e5b] transition hover:bg-[#f5f5f5] disabled:opacity-60"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
