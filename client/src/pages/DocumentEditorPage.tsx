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

    const exportWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
    if (!exportWindow) {
      setError("Allow popups to export PDF.");
      return;
    }

    setIsDownloadingPdf(true);

    const pageTitle = (titleDraft.trim() || document.title || "Untitled Document").replace(/</g, "&lt;");
    const editorMarkup = editorContent.innerHTML;

    exportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>${pageTitle}</title>
          <style>
            body { margin: 0; font-family: ui-serif, Georgia, serif; color: #1f2937; background: white; }
            .page { max-width: 820px; margin: 0 auto; padding: 48px 56px 72px; }
            h1, h2, h3, h4 { color: #111827; }
            p, li, blockquote, td, th { font-size: 15px; line-height: 1.8; }
            blockquote { border-left: 3px solid #cbd5e1; margin: 1.25rem 0; padding-left: 1rem; color: #475467; }
            pre { overflow: auto; border-radius: 12px; background: #f8fafc; padding: 16px; white-space: pre-wrap; }
            code { font-family: "Cascadia Code", Consolas, monospace; }
            table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
            td, th { border: 1px solid #e4e7ec; padding: 10px; text-align: left; }
            .meta { margin-bottom: 2rem; border-bottom: 1px solid #e4e7ec; padding-bottom: 1rem; }
            .meta p { margin: 0.35rem 0; color: #667085; font-family: ui-sans-serif, system-ui, sans-serif; }
          </style>
        </head>
        <body>
          <main class="page">
            <header class="meta">
              <h1>${pageTitle}</h1>
              <p>${document.owner.username}</p>
            </header>
            <section>${editorMarkup}</section>
          </main>
        </body>
      </html>
    `);

    exportWindow.document.close();
    exportWindow.focus();
    window.setTimeout(() => {
      exportWindow.print();
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
      <section className="overflow-hidden rounded-[32px] border border-[#dbe3ee] bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_45%,#edf4ff_100%)] p-6 text-[#101828] shadow-[0_28px_65px_rgba(15,23,42,0.09)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 text-sm text-[#667085]">
              <Link to="/dashboard" className="transition hover:text-[#101828]">
                Back
              </Link>
              <span>{accessLabel}</span>
              <span>{saveState === "saving" ? "Saving" : "Saved"}</span>
              {lastSyncedAt ? <span>{lastSyncedAt}</span> : null}
            </div>
            <input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              disabled={!isOwner}
              className="mt-4 w-full border-none bg-transparent p-0 text-4xl font-semibold tracking-tight text-[#101828] outline-none disabled:cursor-not-allowed disabled:opacity-80 sm:text-5xl"
              placeholder="Untitled Document"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:opacity-60"
            >
              {isDownloadingPdf ? "Preparing..." : "Download PDF"}
            </button>
            {isOwner ? (
              <button
                onClick={handleDeleteDocument}
                disabled={isSaving}
                className="rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc] disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
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

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] border border-[#dde3ec] bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#667085]">
            <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">{participants.length} online</span>
            <span>{document.collaborators.length} collaborators</span>
            <span>Version {document.version}</span>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dde3ec] bg-white p-4 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-semibold text-[#101828]">Session</p>
          <p className="mt-2 text-sm leading-7 text-[#667085]">
            Changes are synced automatically while you edit.
          </p>
        </div>
      </section>
    </div>
  );
}
