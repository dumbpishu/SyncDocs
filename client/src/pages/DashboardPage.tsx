import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addCollaborator,
  createDocument,
  getAllDocuments,
  removeCollaborator,
  updateCollaboratorRole,
  updateDocument,
} from "../api/document.api";
import { useAuth } from "../context/AuthContext";
import type { Collaborator, CollaboratorRole, DocumentRecord, SharedDocuments } from "../types/document";
import { getApiErrorMessage } from "../utils/api";

type WorkspaceDocuments = {
  ownedDocuments: DocumentRecord[];
  sharedDocuments: SharedDocuments;
};

const emptyDocuments: WorkspaceDocuments = {
  ownedDocuments: [],
  sharedDocuments: {
    editor: [],
    viewer: [],
  },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [documents, setDocuments] = useState<WorkspaceDocuments>(emptyDocuments);
  const [selectedOwnedDocumentId, setSelectedOwnedDocumentId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<CollaboratorRole>("viewer");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedOwnedDocument = useMemo(
    () => documents.ownedDocuments.find((document) => document._id === selectedOwnedDocumentId) ?? null,
    [documents.ownedDocuments, selectedOwnedDocumentId],
  );

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const data = await getAllDocuments();
        setDocuments(data ?? emptyDocuments);
        setError("");
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "Unable to load documents."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocuments();
  }, []);

  useEffect(() => {
    if (!documents.ownedDocuments.length) {
      setSelectedOwnedDocumentId("");
      return;
    }

    const nextSelectedDocument =
      documents.ownedDocuments.find((document) => document._id === selectedOwnedDocumentId) ??
      documents.ownedDocuments[0];

    if (nextSelectedDocument && nextSelectedDocument._id !== selectedOwnedDocumentId) {
      setSelectedOwnedDocumentId(nextSelectedDocument._id);
    }
  }, [documents.ownedDocuments, selectedOwnedDocumentId]);

  useEffect(() => {
    setRenameDraft(selectedOwnedDocument?.title ?? "");
  }, [selectedOwnedDocument?._id, selectedOwnedDocument?.title]);

  const totalDocuments =
    documents.ownedDocuments.length +
    documents.sharedDocuments.editor.length +
    documents.sharedDocuments.viewer.length;

  const applyOwnedDocumentUpdate = (updatedDocument: DocumentRecord) => {
    setDocuments((currentDocuments) => ({
      ...currentDocuments,
      ownedDocuments: currentDocuments.ownedDocuments
        .map((document) => (document._id === updatedDocument._id ? updatedDocument : document))
        .sort((left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt)),
    }));
    setSelectedOwnedDocumentId(updatedDocument._id);
  };

  const handleCreateDocument = async () => {
    try {
      setIsCreating(true);
      const document = await createDocument({
        title: "Untitled Document",
        content: "",
      });

      if (document?._id) {
        navigate(`/documents/${document._id}`);
      }
    } catch (createError) {
      setError(getApiErrorMessage(createError, "Unable to create a document."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleRenameDocument = async () => {
    if (!selectedOwnedDocument) return;

    try {
      setIsManaging(true);
      const updatedDocument = await updateDocument(selectedOwnedDocument._id, {
        title: renameDraft.trim() || "Untitled Document",
      });

      if (updatedDocument) {
        applyOwnedDocumentUpdate(updatedDocument);
        setNotice("Document updated.");
        setError("");
      }
    } catch (renameError) {
      setError(getApiErrorMessage(renameError, "Unable to update the document name."));
    } finally {
      setIsManaging(false);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedOwnedDocument || !inviteEmail.trim()) return;

    try {
      setIsManaging(true);
      const updatedDocument = await addCollaborator(selectedOwnedDocument._id, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });

      if (updatedDocument) {
        applyOwnedDocumentUpdate(updatedDocument);
        setInviteEmail("");
        setInviteRole("viewer");
        setNotice("Collaborator added.");
        setError("");
      }
    } catch (inviteError) {
      setError(getApiErrorMessage(inviteError, "Unable to add collaborator."));
    } finally {
      setIsManaging(false);
    }
  };

  const handleRoleChange = async (collaboratorId: string, role: CollaboratorRole) => {
    if (!selectedOwnedDocument) return;

    try {
      setIsManaging(true);
      const updatedDocument = await updateCollaboratorRole(selectedOwnedDocument._id, collaboratorId, role);

      if (updatedDocument) {
        applyOwnedDocumentUpdate(updatedDocument);
        setNotice("Access updated.");
        setError("");
      }
    } catch (roleError) {
      setError(getApiErrorMessage(roleError, "Unable to update access."));
    } finally {
      setIsManaging(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!selectedOwnedDocument) return;

    try {
      setIsManaging(true);
      const updatedDocument = await removeCollaborator(selectedOwnedDocument._id, collaboratorId);

      if (updatedDocument) {
        applyOwnedDocumentUpdate(updatedDocument);
        setNotice("Collaborator removed.");
        setError("");
      }
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, "Unable to remove collaborator."));
    } finally {
      setIsManaging(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[36px] border border-[#dbe3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-7 shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#98a2b3]">Dashboard</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-[#101828] sm:text-5xl">
              {user?.fullName || user?.username || "Workspace"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#667085]">
              Create, open, and manage documents across owned, editor, and viewer access from one workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCreateDocument}
              disabled={isCreating}
              className="cursor-pointer rounded-xl bg-[#111827] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "New document"}
            </button>
            <Link
              to="/account"
              className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-4 py-2.5 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
            >
              Account
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Owned" value={String(documents.ownedDocuments.length)} />
          <MetricCard label="Editor" value={String(documents.sharedDocuments.editor.length)} />
          <MetricCard label="Viewer" value={String(documents.sharedDocuments.viewer.length)} />
          <MetricCard label="Total" value={String(totalDocuments)} />
        </div>
      </section>

      {(error || notice) && (
        <div className="grid gap-3">
          {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          {notice ? <StatusMessage tone="success">{notice}</StatusMessage> : null}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_400px]">
        <div className="space-y-6">
          <DocumentSection
            title="Owned documents"
            documents={documents.ownedDocuments}
            isLoading={isLoading}
            selectedDocumentId={selectedOwnedDocumentId}
            emptyMessage="No documents yet."
            badgeLabel="Owner"
            onSelect={(document) => setSelectedOwnedDocumentId(document._id)}
            onOpen={(documentId) => navigate(`/documents/${documentId}`)}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <DocumentSection
              title="Editor access"
              documents={documents.sharedDocuments.editor}
              isLoading={isLoading}
              emptyMessage="No editor access documents."
              badgeLabel="Editor"
              onSelect={(document) => navigate(`/documents/${document._id}`)}
              onOpen={(documentId) => navigate(`/documents/${documentId}`)}
            />

            <DocumentSection
              title="Viewer access"
              documents={documents.sharedDocuments.viewer}
              isLoading={isLoading}
              emptyMessage="No viewer access documents."
              badgeLabel="Viewer"
              onSelect={(document) => navigate(`/documents/${document._id}`)}
              onOpen={(documentId) => navigate(`/documents/${documentId}`)}
            />
          </div>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-[#dde3ec] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#101828]">Manage document</p>
                <p className="mt-1 text-sm text-[#667085]">
                  {selectedOwnedDocument?.title ?? "Select an owned document to edit access and rename it."}
                </p>
              </div>
              {selectedOwnedDocument ? (
                <button
                  onClick={() => navigate(`/documents/${selectedOwnedDocument._id}`)}
                  className="cursor-pointer rounded-xl bg-[#111827] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#0f172a]"
                >
                  Open
                </button>
              ) : null}
            </div>

            {selectedOwnedDocument ? (
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#344054]">Name</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={renameDraft}
                      onChange={(event) => setRenameDraft(event.target.value)}
                      className="min-w-0 flex-1 rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                      placeholder="Untitled Document"
                    />
                    <button
                      onClick={handleRenameDocument}
                      disabled={isManaging || normalizeDocumentTitle(renameDraft) === selectedOwnedDocument.title}
                      className="cursor-pointer rounded-xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0f172a] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Save
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#344054]">Add collaborator</label>
                  <div className="space-y-3">
                    <input
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      className="w-full rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                      placeholder="email@example.com"
                    />
                    <div className="flex gap-3">
                      <select
                        value={inviteRole}
                        onChange={(event) => setInviteRole(event.target.value as CollaboratorRole)}
                        className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-[#fcfcfd] px-4 py-3 text-sm text-[#101828] outline-none transition focus:border-[#274690]"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>
                      <button
                        onClick={handleAddCollaborator}
                        disabled={isManaging || !inviteEmail.trim()}
                        className="cursor-pointer rounded-xl bg-[#274690] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4f91] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-[#344054]">Collaborators</p>
                  <div className="mt-3 space-y-3">
                    {selectedOwnedDocument.collaborators.length ? (
                      selectedOwnedDocument.collaborators.map((collaborator) => (
                        <CollaboratorManagerRow
                          key={collaborator.user._id}
                          collaborator={collaborator}
                          disabled={isManaging}
                          onRoleChange={handleRoleChange}
                          onRemove={handleRemoveCollaborator}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-5 text-sm text-[#667085]">
                        No collaborators.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-8 text-sm text-[#667085]">
                Select an owned document to manage it.
              </div>
            )}
          </section>
        </aside>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#dbe3ee] bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
      <p className="text-3xl font-semibold tracking-tight text-[#101828]">{value}</p>
      <p className="mt-2 text-sm text-[#667085]">{label}</p>
    </div>
  );
}

function DocumentSection({
  title,
  documents,
  isLoading,
  emptyMessage,
  selectedDocumentId,
  badgeLabel,
  onSelect,
  onOpen,
}: {
  title: string;
  documents: DocumentRecord[];
  isLoading: boolean;
  emptyMessage: string;
  selectedDocumentId?: string;
  badgeLabel: string;
  onSelect: (document: DocumentRecord) => void;
  onOpen: (documentId: string) => void;
}) {
  return (
    <section className="rounded-[32px] border border-[#dde3ec] bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.07)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#101828]">{title}</p>
        <span className="rounded-full bg-[#f2f4f7] px-3 py-1 text-[11px] font-semibold text-[#667085]">
          {documents.length}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-[#eef2f7]" />
          ))
        ) : documents.length ? (
          documents.map((document) => {
            const isSelected = selectedDocumentId === document._id;

            return (
              <article
                key={document._id}
                onClick={() => onSelect(document)}
                className={`cursor-pointer rounded-2xl border p-4 transition ${
                  isSelected
                    ? "border-[#aac0e8] bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] shadow-[0_16px_28px_rgba(39,70,144,0.10)]"
                    : "border-[#e4e7ec] bg-[#fcfcfd] hover:border-[#cfd6e3] hover:shadow-[0_14px_24px_rgba(15,23,42,0.05)]"
                }`}
              >
                <div className="flex gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-[#101828]">{document.title}</p>
                      <span className="rounded-lg bg-[#eef4ff] px-2 py-1 text-[11px] font-semibold text-[#274690]">
                        {badgeLabel}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#667085]">
                      {extractPlainText(document.content) || "No content"}
                    </p>
                    <p className="mt-2 text-xs text-[#98a2b3]">{formatDate(document.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(document._id);
                    }}
                    className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-3 py-2 text-sm font-semibold text-[#344054] transition hover:bg-[#f8fafc]"
                  >
                    Open
                  </button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#fcfcfd] px-4 py-8 text-sm text-[#667085]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

function CollaboratorManagerRow({
  collaborator,
  disabled,
  onRoleChange,
  onRemove,
}: {
  collaborator: Collaborator;
  disabled: boolean;
  onRoleChange: (collaboratorId: string, role: CollaboratorRole) => void;
  onRemove: (collaboratorId: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e4e7ec] bg-[#fcfcfd] p-4">
      <p className="text-sm font-medium text-[#101828]">{collaborator.user.username}</p>
      <p className="mt-1 text-sm text-[#667085]">{collaborator.user.email}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <select
          value={collaborator.role}
          onChange={(event) => onRoleChange(collaborator.user._id, event.target.value as CollaboratorRole)}
          disabled={disabled}
          className="cursor-pointer rounded-xl border border-[#d0d5dd] bg-white px-4 py-2 text-sm text-[#344054] outline-none transition focus:border-[#274690] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="viewer">Viewer</option>
          <option value="editor">Editor</option>
        </select>
        <button
          type="button"
          onClick={() => onRemove(collaborator.user._id)}
          disabled={disabled}
          className="cursor-pointer rounded-xl border border-[#f0d5dd] bg-[#fff7f8] px-4 py-2 text-sm font-semibold text-[#b42318] transition hover:bg-[#fff1f3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function StatusMessage({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  const toneClassName =
    tone === "error"
      ? "border-[#f0d5dd] bg-[#fff7f8] text-[#b42318]"
      : "border-[#cce8d8] bg-[#f2fbf5] text-[#067647]";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm shadow-[0_10px_22px_rgba(15,23,42,0.03)] ${toneClassName}`}>
      {children}
    </div>
  );
}

function extractPlainText(content: string) {
  if (!content) return "";

  try {
    const parsedContent = JSON.parse(content);
    const nodes = parsedContent?.root?.children ?? [];
    return nodes
      .flatMap((node: { children?: Array<{ text?: string }> }) => node.children ?? [])
      .map((child: { text?: string }) => child.text ?? "")
      .join(" ")
      .trim();
  } catch {
    return content;
  }
}

function normalizeDocumentTitle(title: string) {
  return title.trim() || "Untitled Document";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
