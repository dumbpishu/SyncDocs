import { useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { CheckListPlugin } from "@lexical/react/LexicalCheckListPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  CodeHighlightNode,
  CodeNode,
  $createCodeNode,
  registerCodeHighlighting,
} from "@lexical/code";
import { LinkNode } from "@lexical/link";
import {
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_TABLE_COMMAND, TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { $setBlocksType } from "@lexical/selection";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";
import type { RemoteCursor } from "../../types/document";

type CollaborativeLexicalEditorProps = {
  documentId: string;
  serializedContent: string;
  canEdit: boolean;
  remoteCursors: RemoteCursor[];
  onSerializedChange: (serializedContent: string) => void;
  onCursorChange: (cursor: { x: number; y: number; height: number } | null) => void;
};

type SyncState = {
  isApplyingRemote: boolean;
  lastSerialized: string;
};

const editorTheme = {
  paragraph: "mb-3",
  quote: "border-l-2 border-black/10 pl-4 text-[#5f5e5b] italic",
  heading: {
    h1: "mb-4 mt-6 text-3xl font-semibold text-[#191919]",
    h2: "mb-3 mt-5 text-2xl font-semibold text-[#191919]",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
  },
  list: {
    ul: "my-4 list-disc pl-6",
    ol: "my-4 list-decimal pl-6",
    checklist: "my-4 space-y-2",
    listitem: "my-1",
    nested: {
      listitem: "mt-1",
    },
  },
  code: "rounded-lg bg-[#f7f7f5] px-1.5 py-0.5 font-mono text-[13px]",
  codeHighlight: {
    atrule: "text-[#7c3aed]",
    attr: "text-[#2563eb]",
    boolean: "text-[#dc2626]",
    builtin: "text-[#2563eb]",
    cdata: "text-[#6b6b6b]",
    char: "text-[#059669]",
    class: "text-[#2563eb]",
    "class-name": "text-[#2563eb]",
    comment: "text-[#9b9a97]",
    constant: "text-[#dc2626]",
    deleted: "text-[#dc2626]",
    doctype: "text-[#9b9a97]",
    entity: "text-[#dc2626]",
    function: "text-[#2563eb]",
    important: "text-[#dc2626]",
    inserted: "text-[#059669]",
    keyword: "text-[#7c3aed]",
    namespace: "text-[#6b6b6b]",
    number: "text-[#d97706]",
    operator: "text-[#191919]",
    prolog: "text-[#9b9a97]",
    property: "text-[#2563eb]",
    punctuation: "text-[#6b6b6b]",
    regex: "text-[#059669]",
    selector: "text-[#dc2626]",
    string: "text-[#059669]",
    symbol: "text-[#d97706]",
    tag: "text-[#dc2626]",
    url: "text-[#2563eb]",
    variable: "text-[#191919]",
  },
  link: "text-[#2f2f2f] underline underline-offset-2",
};

const createPlainTextDocumentState = (content: string) => {
  const paragraphNodes = (content || "")
    .split("\n")
    .map((line) => ({
      children: [
        {
          detail: 0,
          format: 0,
          mode: "normal",
          style: "",
          text: line,
          type: "text",
          version: 1,
        },
      ],
      direction: null,
      format: "",
      indent: 0,
      type: "paragraph",
      version: 1,
      textFormat: 0,
      textStyle: "",
    }));

  return JSON.stringify({
    root: {
      children: paragraphNodes.length
        ? paragraphNodes
        : [
            {
              children: [],
              direction: null,
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
              textFormat: 0,
              textStyle: "",
            },
          ],
      direction: null,
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  });
};

const normalizeSerializedContent = (content: string) => {
  if (!content) {
    return createPlainTextDocumentState("");
  }

  try {
    const parsedContent = JSON.parse(content);
    if (parsedContent?.root?.type === "root") {
      return content;
    }
  } catch (error) {
    // Fall back to plain-text conversion for older documents.
  }

  return createPlainTextDocumentState(content);
};

export function CollaborativeLexicalEditor({
  documentId,
  serializedContent,
  canEdit,
  remoteCursors,
  onSerializedChange,
  onCursorChange,
}: CollaborativeLexicalEditorProps) {
  const syncStateRef = useRef<SyncState>({
    isApplyingRemote: false,
    lastSerialized: normalizeSerializedContent(serializedContent),
  });

  const initialConfig = {
    namespace: `syncdocs-${documentId}`,
    editable: canEdit,
    theme: editorTheme,
    onError(error: Error) {
      throw error;
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      LinkNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  };

  return (
    <div className="relative rounded-[1.25rem] border border-black/8 bg-white">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin canEdit={canEdit} />
        <EditorContentSync
          serializedContent={serializedContent}
          canEdit={canEdit}
          syncStateRef={syncStateRef}
          onSerializedChange={onSerializedChange}
          onCursorChange={onCursorChange}
        />

        <div className="relative min-h-[520px] px-5 py-4">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[488px] resize-none text-[15px] leading-7 text-[#2f2f2f] outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-5 top-4 text-sm text-[#9b9a97]">
                Start writing here...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <AutoFocusPlugin />
          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          <LinkPlugin />
          <TablePlugin />
          <CodeHighlightRegisterPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />

          <div className="pointer-events-none absolute inset-0">
            {remoteCursors.map((cursor) => (
              <div
                key={cursor.userId}
                className="absolute"
                style={{
                  left: cursor.x,
                  top: cursor.y,
                  height: cursor.height,
                }}
              >
                <div
                  className="absolute top-0 w-0.5"
                  style={{
                    backgroundColor: cursor.color,
                    height: cursor.height,
                  }}
                />
                <div
                  className="absolute left-0 top-0 -translate-y-full rounded px-2 py-1 text-[11px] font-medium text-white shadow-sm"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.username}
                </div>
              </div>
            ))}
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

function CodeHighlightRegisterPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCodeHighlighting(editor), [editor]);

  return null;
}

function ToolbarPlugin({ canEdit }: { canEdit: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        editor.getEditorState().read(() => {
          const selection = $getSelection();

          if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat("bold"));
            setIsItalic(selection.hasFormat("italic"));
            setIsUnderline(selection.hasFormat("underline"));
            setIsStrikethrough(selection.hasFormat("strikethrough"));
            setIsCode(selection.hasFormat("code"));
          }
        });

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, setIsBold, setIsItalic, setIsUnderline, setIsStrikethrough, setIsCode]);

  useEffect(() => editor.registerCommand(CAN_UNDO_COMMAND, (payload) => {
    setCanUndo(payload);
    return false;
  }, COMMAND_PRIORITY_LOW), [editor, setCanUndo]);

  useEffect(() => editor.registerCommand(CAN_REDO_COMMAND, (payload) => {
    setCanRedo(payload);
    return false;
  }, COMMAND_PRIORITY_LOW), [editor, setCanRedo]);

  const applyBlockType = (type: "paragraph" | "h1" | "h2" | "quote" | "code") => {
    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      if (type === "paragraph") {
        $setBlocksType(selection, () => $createParagraphNode());
        return;
      }

      if (type === "quote") {
        $setBlocksType(selection, () => $createQuoteNode());
        return;
      }

      if (type === "code") {
        $setBlocksType(selection, () => $createCodeNode());
        return;
      }

      $setBlocksType(selection, () => $createHeadingNode(type));
    });
  };

  const toggleLink = () => {
    const url = window.prompt("Enter a link URL");
    if (!url) {
      return;
    }
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-black/8 px-4 py-3">
      <ToolbarButton label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={!canEdit || !canUndo} />
      <ToolbarButton label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={!canEdit || !canRedo} />
      <ToolbarDivider />
      <ToolbarButton label="P" onClick={() => applyBlockType("paragraph")} disabled={!canEdit} />
      <ToolbarButton label="H1" onClick={() => applyBlockType("h1")} disabled={!canEdit} />
      <ToolbarButton label="H2" onClick={() => applyBlockType("h2")} disabled={!canEdit} />
      <ToolbarButton label="Quote" onClick={() => applyBlockType("quote")} disabled={!canEdit} />
      <ToolbarButton label="Code block" onClick={() => applyBlockType("code")} disabled={!canEdit} />
      <ToolbarDivider />
      <ToolbarButton label="B" active={isBold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} disabled={!canEdit} />
      <ToolbarButton label="I" active={isItalic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} disabled={!canEdit} />
      <ToolbarButton label="U" active={isUnderline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} disabled={!canEdit} />
      <ToolbarButton label="S" active={isStrikethrough} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")} disabled={!canEdit} />
      <ToolbarButton label="Inline code" active={isCode} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")} disabled={!canEdit} />
      <ToolbarDivider />
      <ToolbarButton label="Bullets" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} disabled={!canEdit} />
      <ToolbarButton label="Numbers" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} disabled={!canEdit} />
      <ToolbarButton label="Checklist" onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)} disabled={!canEdit} />
      <ToolbarButton label="Clear list" onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)} disabled={!canEdit} />
      <ToolbarDivider />
      <ToolbarButton
        label="Table"
        onClick={() =>
          editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3", includeHeaders: true })
        }
        disabled={!canEdit}
      />
      <ToolbarButton label="Link" onClick={toggleLink} disabled={!canEdit} />
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-[#191919] text-white"
          : "bg-white text-[#4b4b4b] hover:bg-[#f3f3f1]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="h-6 w-px bg-black/8" />;
}

function EditorContentSync({
  serializedContent,
  canEdit,
  syncStateRef,
  onSerializedChange,
  onCursorChange,
}: {
  serializedContent: string;
  canEdit: boolean;
  syncStateRef: React.MutableRefObject<SyncState>;
  onSerializedChange: (serializedContent: string) => void;
  onCursorChange: (cursor: { x: number; y: number; height: number } | null) => void;
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    editor.setEditable(canEdit);
  }, [canEdit, editor]);

  useEffect(() => {
    const nextSerialized = normalizeSerializedContent(serializedContent);

    if (nextSerialized === syncStateRef.current.lastSerialized) {
      return;
    }

    syncStateRef.current.isApplyingRemote = true;
    syncStateRef.current.lastSerialized = nextSerialized;

    const parsedEditorState = editor.parseEditorState(nextSerialized);
    editor.setEditorState(parsedEditorState);
  }, [editor, serializedContent, syncStateRef]);

  useEffect(() => {
    const measureCursor = () => {
      const rootElement = editor.getRootElement();
      const selection = window.getSelection();

      if (!rootElement || !selection || selection.rangeCount === 0) {
        onCursorChange(null);
        return;
      }

      const anchorNode = selection.anchorNode;
      if (!anchorNode || !rootElement.contains(anchorNode)) {
        onCursorChange(null);
        return;
      }

      const range = selection.getRangeAt(0);
      let rect = range.getBoundingClientRect();

      if (!rect.height) {
        const parentElement = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
        rect = parentElement?.getBoundingClientRect() ?? rect;
      }

      const rootRect = rootElement.getBoundingClientRect();
      onCursorChange({
        x: Math.max(rect.left - rootRect.left, 0),
        y: Math.max(rect.top - rootRect.top, 0),
        height: rect.height || 20,
      });
    };

    const unregister = editor.registerUpdateListener(() => {
      window.requestAnimationFrame(measureCursor);
    });

    document.addEventListener("selectionchange", measureCursor);

    return () => {
      unregister();
      document.removeEventListener("selectionchange", measureCursor);
    };
  }, [editor, onCursorChange]);

  return (
    <OnChangePlugin
      ignoreSelectionChange={false}
      onChange={(editorState) => {
        const serializedState = JSON.stringify(editorState.toJSON());

        if (syncStateRef.current.isApplyingRemote) {
          syncStateRef.current.isApplyingRemote = false;
          syncStateRef.current.lastSerialized = serializedState;
          return;
        }

        if (serializedState === syncStateRef.current.lastSerialized) {
          return;
        }

        syncStateRef.current.lastSerialized = serializedState;
        onSerializedChange(serializedState);
      }}
    />
  );
}
