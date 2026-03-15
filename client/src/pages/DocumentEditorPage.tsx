import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteDocument, getDocumentById, updateDocument } from "../api/document.api";
import { CollaborativeLexicalEditor } from "../components/editor/CollaborativeLexicalEditor";
import { useAuth } from "../context/AuthContext";
import { getCollaborationSocket } from "../services/realtime";
import type { DocumentRecord, OnlineParticipant, RemoteCursor } from "../types/document";
import { getApiErrorMessage } from "../utils/api";

export default function DocumentEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useMemo(() => getCollaborationSocket(), []);
  const lastBroadcastedTitleRef = useRef("");
  const pendingContentRef = useRef<string | null>(null);
  const pendingTitleRef = useRef<string | null>(null);
  const latestContentRef = useRef("");
  const latestTitleRef = useRef("");
  const isPersistingRef = useRef(false);

  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [serializedContent, setSerializedContent] = useState("");
  const [participants, setParticipants] = useState<OnlineParticipant[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving">("saved");
  const [error, setError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("");

  const isOwner = document?.owner?._id === user?._id;
  const currentCollaborator = document?.collaborators.find(
    (collaborator) => collaborator.user?._id === user?._id,
  );
  const canEdit = Boolean(document && (isOwner || currentCollaborator?.role === "editor"));
  const accessLabel = isOwner ? "Owner" : currentCollaborator?.role === "editor" ? "Editor" : "Viewer";
  const onlineUserIds = new Set(participants.map((participant) => participant.userId));
  const hasCurrentUserAccess = Boolean(document && (isOwner || currentCollaborator));
  if (hasCurrentUserAccess && user?._id) {
    onlineUserIds.add(user._id);
  }
  const onlineCount = onlineUserIds.size;
  const participantSummaries = document
    ? [
        {
          userId: document.owner._id,
          username: document.owner.username,
          role: "Owner",
          online: onlineUserIds.has(document.owner._id),
          color:
            participants.find((participant) => participant.userId === document.owner._id)?.color ?? "#111827",
        },
        ...document.collaborators.map((collaborator) => ({
          userId: collaborator.user._id,
          username: collaborator.user.username,
          role: collaborator.role === "editor" ? "Editor" : "Viewer",
          online: onlineUserIds.has(collaborator.user._id),
          color:
            participants.find((participant) => participant.userId === collaborator.user._id)?.color ?? "#98a2b3",
        })),
      ]
    : [];
  const displayedParticipants = participantSummaries.slice(0, 5);
  const overflowParticipants = Math.max(participantSummaries.length - displayedParticipants.length, 0);

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
      latestContentRef.current = nextDocument.content ?? "";
      latestTitleRef.current = nextDocument.title;
      pendingContentRef.current = null;
      pendingTitleRef.current = null;
      setError("");
    } catch (loadError) {
      setError(getApiErrorMessage(loadError, "Unable to load document."));
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
      if (payload.documentId !== id) return;

      setParticipants(payload.participants);
      setRemoteCursors(payload.cursors.filter((cursor) => cursor.userId !== user?._id));
      setSerializedContent(payload.content ?? "");
      setTitleDraft(payload.title ?? "");
      lastBroadcastedTitleRef.current = payload.title ?? "";
      latestContentRef.current = payload.content ?? "";
      latestTitleRef.current = payload.title ?? "";
      pendingContentRef.current = null;
      pendingTitleRef.current = null;
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
      if (payload.documentId !== id) return;

      setSerializedContent(payload.content ?? "");
      latestContentRef.current = payload.content ?? "";
      setDocument((currentDocument) =>
        currentDocument ? { ...currentDocument, content: payload.content ?? "" } : currentDocument,
      );
    };

    const handleRemoteTitleUpdate = (payload: { documentId: string; title: string }) => {
      if (payload.documentId !== id) return;

      setTitleDraft(payload.title ?? "");
      lastBroadcastedTitleRef.current = payload.title ?? "";
      latestTitleRef.current = payload.title ?? "";
      setDocument((currentDocument) =>
        currentDocument ? { ...currentDocument, title: payload.title ?? "" } : currentDocument,
      );
    };

    const handleDocumentSaved = (payload: {
      documentId: string;
      content: string;
      title: string;
      version: number;
      savedAt: string;
    }) => {
      if (payload.documentId !== id) return;

      setSerializedContent(payload.content ?? "");
      setTitleDraft(payload.title ?? "");
      lastBroadcastedTitleRef.current = payload.title ?? "";
      latestContentRef.current = payload.content ?? "";
      latestTitleRef.current = payload.title ?? "";
      pendingContentRef.current = null;
      pendingTitleRef.current = null;
      setSaveState("saved");
      setLastSyncedAt(
        new Date(payload.savedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      );
      setDocument((currentDocument) =>
        currentDocument
          ? {
              ...currentDocument,
              content: payload.content ?? "",
              title: payload.title ?? currentDocument.title,
              version: payload.version ?? currentDocument.version,
            }
          : currentDocument,
      );
    };

    const handleRealtimeError = (payload: { message: string }) => {
      setError(payload.message);
    };

    socket.on("document:bootstrap", handleBootstrap);
    socket.on("presence:update", handlePresenceUpdate);
    socket.on("document:update", handleRemoteUpdate);
    socket.on("document:title:update", handleRemoteTitleUpdate);
    socket.on("document:saved", handleDocumentSaved);
    socket.on("document:error", handleRealtimeError);

    return () => {
      socket.emit("document:leave");
      socket.off("document:bootstrap", handleBootstrap);
      socket.off("presence:update", handlePresenceUpdate);
      socket.off("document:update", handleRemoteUpdate);
      socket.off("document:title:update", handleRemoteTitleUpdate);
      socket.off("document:saved", handleDocumentSaved);
      socket.off("document:error", handleRealtimeError);
      socket.disconnect();
    };
  }, [id, socket, user?._id]);

  useEffect(() => {
    if (!id) return;

    socket.emit("document:join", { documentId: id });

    return () => {
      socket.emit("document:leave");
      setParticipants([]);
      setRemoteCursors([]);
    };
  }, [id, socket]);

  const flushPendingRealtimeChanges = async () => {
    if (!id) return;
    if (isPersistingRef.current) return;

    const nextContent = pendingContentRef.current;
    const nextTitle = pendingTitleRef.current;

    if (nextContent === null && nextTitle === null) {
      return;
    }

    const payload: { content?: string; title?: string } = {};

    if (nextContent !== null) {
      latestContentRef.current = nextContent;
      payload.content = nextContent;
    }

    if (nextTitle !== null) {
      latestTitleRef.current = nextTitle;
      payload.title = nextTitle;
    }

    isPersistingRef.current = true;

    try {
      const updatedDocument = await updateDocument(id, payload);

      if (nextContent !== null) {
        socket.emit("document:update", {
          documentId: id,
          content: nextContent,
        });
        pendingContentRef.current = null;
      }

      if (nextTitle !== null) {
        socket.emit("document:title:update", {
          documentId: id,
          title: nextTitle,
        });
        lastBroadcastedTitleRef.current = nextTitle;
        pendingTitleRef.current = null;
      }

      if (updatedDocument) {
        latestContentRef.current = updatedDocument.content ?? latestContentRef.current;
        latestTitleRef.current = updatedDocument.title ?? latestTitleRef.current;
        setSerializedContent(updatedDocument.content ?? "");
        setTitleDraft(updatedDocument.title ?? "");
        setSaveState("saved");
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        setDocument(updatedDocument);
      }
    } catch (flushError) {
      setError(getApiErrorMessage(flushError, "Unable to save document changes."));
    } finally {
      isPersistingRef.current = false;
    }
  };

  useEffect(() => {
    if (!id || (!canEdit && !isOwner)) return;

    const intervalId = window.setInterval(() => {
      void flushPendingRealtimeChanges();
    }, 5000);

    const flushBeforeLeave = () => {
      void flushPendingRealtimeChanges();
    };

    window.addEventListener("beforeunload", flushBeforeLeave);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", flushBeforeLeave);
      void flushPendingRealtimeChanges();
    };
  }, [canEdit, id, isOwner, socket]);

  const handleRealtimeContentChange = (nextSerializedContent: string) => {
    if (!id || !canEdit) return;

    setSerializedContent(nextSerializedContent);
    latestContentRef.current = nextSerializedContent;
    pendingContentRef.current = nextSerializedContent;
    setSaveState("saving");
    setDocument((currentDocument) =>
      currentDocument ? { ...currentDocument, content: nextSerializedContent } : currentDocument,
    );
  };

  useEffect(() => {
    if (!id || !document || !isOwner) return;

    const normalizedTitle = titleDraft.trim() || "Untitled Document";
    if (normalizedTitle === lastBroadcastedTitleRef.current) return;

    latestTitleRef.current = normalizedTitle;
    pendingTitleRef.current = normalizedTitle;
    setSaveState("saving");
  }, [document, id, isOwner, socket, titleDraft]);

  const handleCursorChange = (cursor: { x: number; y: number; height: number } | null) => {
    if (!id) return;
    socket.emit("cursor:update", { documentId: id, cursor });
  };

  const handleDeleteDocument = async () => {
    if (!id || !isOwner) return;

    const shouldDelete = window.confirm("Delete this document?");
    if (!shouldDelete) return;

    try {
      setIsSaving(true);
      await deleteDocument(id);
      navigate("/dashboard", { replace: true });
    } catch (deleteError) {
      setError(getApiErrorMessage(deleteError, "Unable to delete document."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!document) return;

    const editorContent = window.document.querySelector(".syncdocs-editor-content");
    if (!editorContent) {
      setError("Editor content is not ready.");
      return;
    }

    setIsDownloadingPdf(true);
    setError("");

    const editorMarkup = editorContent.innerHTML;
    const printFrame = window.document.createElement("iframe");
    printFrame.style.position = "fixed";
    printFrame.style.right = "0";
    printFrame.style.bottom = "0";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "0";
    printFrame.setAttribute("aria-hidden", "true");
    window.document.body.appendChild(printFrame);

    const cleanupPrintFrame = () => {
      window.setTimeout(() => {
        printFrame.remove();
      }, 250);
    };

    const printDocument = printFrame.contentWindow?.document;
    if (!printDocument || !printFrame.contentWindow) {
      cleanupPrintFrame();
      setIsDownloadingPdf(false);
      setError("Unable to prepare PDF export.");
      return;
    }

    printDocument.open();
    printDocument.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Document Export</title>
          <style>
            @page { margin: 18mm; }
            body { margin: 0; font-family: ui-serif, Georgia, serif; color: #1f2937; background: white; }
            .page { max-width: 820px; margin: 0 auto; padding: 0; }
            h1, h2, h3, h4 { color: #111827; }
            p, li, blockquote, td, th { font-size: 15px; line-height: 1.8; }
            img { max-width: 100%; border-radius: 12px; }
            blockquote { border-left: 3px solid #cbd5e1; margin: 1.25rem 0; padding-left: 1rem; color: #475467; }
            pre { overflow: auto; border-radius: 12px; background: #f8fafc; padding: 16px; white-space: pre-wrap; }
            code { font-family: "Cascadia Code", Consolas, monospace; }
            table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            td, th { border: 1px solid #e4e7ec; padding: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <main class="page">
            <section>${editorMarkup}</section>
          </main>
        </body>
      </html>
    `);
    printDocument.close();

    window.setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      cleanupPrintFrame();
      setIsDownloadingPdf(false);
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-32 animate-pulse rounded-[28px] bg-[#e8edf5]" />
        <div className="min-h-[72vh] animate-pulse rounded-[28px] bg-[#eef2f7]" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-base font-semibold text-[#101828]">Document unavailable</p>
        <p className="mt-2 text-sm text-[#667085]">The document could not be opened.</p>
        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
        >
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <section className="rounded-[32px] border border-[#d8dee9] bg-white p-5 shadow-[0_20px_44px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#667085]">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center rounded-full border border-[#d0d5dd] bg-white px-3 py-1.5 font-medium transition hover:border-[#bfc7d3] hover:text-[#101828]"
                >
                  Back
                </Link>
                <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">{accessLabel}</span>
                <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">
                  {saveState === "saving" ? "Saving" : "Saved"}
                </span>
                {lastSyncedAt ? (
                  <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">
                    {lastSyncedAt}
                  </span>
                ) : null}
              </div>

              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                disabled={!isOwner}
                className="mt-5 w-full border-none bg-transparent p-0 text-3xl font-semibold tracking-tight text-[#101828] outline-none disabled:cursor-not-allowed disabled:opacity-80 sm:text-4xl"
                placeholder="Untitled Document"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="cursor-pointer rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloadingPdf ? "Preparing..." : "Download PDF"}
              </button>
              {isOwner ? (
                <button
                  onClick={handleDeleteDocument}
                  disabled={isSaving}
                  className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#eef2f6] pt-4">
            <div className="flex -space-x-2">
              {displayedParticipants.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-semibold text-white shadow-sm"
                  style={{ backgroundColor: participant.color }}
                  title={`${participant.username} - ${participant.role}`}
                >
                  {participant.username.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {overflowParticipants ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#e4e7ec] text-xs font-semibold text-[#344054] shadow-sm">
                  +{overflowParticipants}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-[#667085]">
              <span className="rounded-full bg-[#f8fafc] px-3 py-1.5 font-medium text-[#344054]">
                {onlineCount} online
              </span>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1.5 font-medium text-[#344054]">
                Version {document.version}
              </span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#f0d5dd] bg-[#fff7f8] px-4 py-3 text-sm text-[#b42318]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="rounded-[32px] border border-[#dde3ec] bg-white p-3 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <CollaborativeLexicalEditor
          key={document._id}
          documentId={document._id}
          serializedContent={serializedContent}
          canEdit={canEdit}
          remoteCursors={remoteCursors}
          onSerializedChange={handleRealtimeContentChange}
          onCursorChange={handleCursorChange}
        />
      </section>

      <section className="rounded-[28px] border border-[#dde3ec] bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[#101828]">People in this document</p>
          <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 text-xs font-semibold text-[#344054]">
            {onlineCount} online
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {participantSummaries.map((participant) => (
            <div
              key={participant.userId}
              className="flex items-center justify-between gap-3 rounded-2xl border border-[#eaecf0] bg-[#fcfcfd] px-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: participant.color }}
                >
                  {participant.username.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#101828]">
                    {participant.username}
                    {participant.userId === user?._id ? " (You)" : ""}
                  </p>
                  <p className="text-xs text-[#667085]">{participant.role}</p>
                </div>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  participant.online ? "bg-[#ecfdf3] text-[#027a48]" : "bg-[#f2f4f7] text-[#667085]"
                }`}
              >
                {participant.online ? "Online" : "Offline"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
