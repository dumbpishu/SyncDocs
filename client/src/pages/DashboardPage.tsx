import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDocument, getAllDocuments } from "../api/document.api";
import { useAuth } from "../context/AuthContext";
import type { DocumentRecord, SharedDocuments } from "../types/document";
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
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);
        const data = await getAllDocuments();
        setDocuments(data ?? emptyDocuments);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, "We couldn't load your dashboard right now."));
      } finally {
        setIsLoading(false);
      }
    };

    void loadDocuments();
  }, []);

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
      setError(getApiErrorMessage(createError, "Unable to create a new document."));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[1.75rem] border border-black/8 bg-[#fbfbfa] p-6 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#787774]">
              Dashboard
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#191919]">
              Welcome back{user?.username ? `, ${user.username}` : ""}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6b6b6b]">
              Open an existing document, review shared work, or start a new collaborative draft in a dedicated editor page.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleCreateDocument}
              disabled={isCreating}
              className="rounded-xl bg-[#191919] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2f2f2f] disabled:opacity-60"
            >
              {isCreating ? "Creating..." : "New document"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <SummaryCard label="Owned" value={String(documents.ownedDocuments.length)} />
          <SummaryCard label="Editor access" value={String(documents.sharedDocuments.editor.length)} />
          <SummaryCard label="Viewer access" value={String(documents.sharedDocuments.viewer.length)} />
          <SummaryCard label="Total workspace docs" value={String(
            documents.ownedDocuments.length +
              documents.sharedDocuments.editor.length +
              documents.sharedDocuments.viewer.length,
          )} />
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-black/8 bg-[#f1f1ef] px-4 py-3 text-sm text-[#3f3f3f]">
            {error}
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <DocumentListCard
            title="Owned by you"
            description="Documents you can edit, manage, and share."
            documents={documents.ownedDocuments}
            isLoading={isLoading}
            emptyMessage="You have not created any documents yet."
            onOpen={(documentId) => navigate(`/documents/${documentId}`)}
          />

          <DocumentListCard
            title="Shared with edit access"
            description="Documents where you can actively contribute."
            documents={documents.sharedDocuments.editor}
            isLoading={isLoading}
            emptyMessage="No documents have been shared with editor access."
            onOpen={(documentId) => navigate(`/documents/${documentId}`)}
          />
        </div>

        <div className="space-y-6">
          <DocumentListCard
            title="Shared as viewer"
            description="Reference documents you can review but not change."
            documents={documents.sharedDocuments.viewer}
            isLoading={isLoading}
            emptyMessage="No read-only documents are shared with you."
            onOpen={(documentId) => navigate(`/documents/${documentId}`)}
            compact
          />

          <aside className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-5 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
            <p className="text-sm font-semibold text-[#191919]">Workspace notes</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[#6b6b6b]">
              <p>New documents open in a dedicated editor page with rich-text controls, live collaboration, and cursor presence.</p>
              <p>Owner and collaborator permissions are still enforced by the server, so viewer-only users can open documents safely in read-only mode.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-black/8 bg-white p-5">
      <p className="text-3xl font-semibold tracking-tight text-[#191919]">{value}</p>
      <p className="mt-2 text-sm text-[#6b6b6b]">{label}</p>
    </div>
  );
}

function DocumentListCard({
  title,
  description,
  documents,
  isLoading,
  emptyMessage,
  onOpen,
  compact = false,
}: {
  title: string;
  description: string;
  documents: DocumentRecord[];
  isLoading: boolean;
  emptyMessage: string;
  onOpen: (documentId: string) => void;
  compact?: boolean;
}) {
  return (
    <section className="rounded-[1.5rem] border border-black/8 bg-[#fbfbfa] p-5 shadow-[0_1px_3px_rgba(15,15,15,0.05)]">
      <p className="text-sm font-semibold text-[#191919]">{title}</p>
      <p className="mt-1 text-sm text-[#6b6b6b]">{description}</p>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          Array.from({ length: compact ? 3 : 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-[#ececea]" />
          ))
        ) : documents.length ? (
          documents.map((document) => (
            <button
              key={document._id}
              onClick={() => onOpen(document._id)}
              className="w-full rounded-xl border border-black/8 bg-white px-4 py-4 text-left transition hover:bg-[#f7f7f5]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#191919]">{document.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6b6b6b]">
                    {extractPlainText(document.content) || "No content yet."}
                  </p>
                </div>
                <span className="rounded-full bg-[#efefed] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#5f5e5b]">
                  Open
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#787774]">
                <span>{formatDate(document.updatedAt)}</span>
                <span>{document.collaborators.length} collaborators</span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-black/10 bg-white px-4 py-8 text-sm text-[#6b6b6b]">
            {emptyMessage}
          </div>
        )}
      </div>
    </section>
  );
}

function extractPlainText(content: string) {
  if (!content) {
    return "";
  }

  try {
    const parsedContent = JSON.parse(content);
    const nodes = parsedContent?.root?.children ?? [];
    return nodes
      .flatMap((node: { children?: Array<{ text?: string }> }) => node.children ?? [])
      .map((child: { text?: string }) => child.text ?? "")
      .join(" ")
      .trim();
  } catch (error) {
    return content;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
