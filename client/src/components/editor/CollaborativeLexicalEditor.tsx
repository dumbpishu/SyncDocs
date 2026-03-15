import { useEffect, useMemo, useRef, useState } from "react";
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
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { $patchStyleText, $setBlocksType } from "@lexical/selection";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import { TRANSFORMERS } from "@lexical/markdown";
import type { RemoteCursor } from "../../types/document";
import { ImageNode, insertImage } from "./nodes/ImageNode";

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
  quote: "border-l-2 border-[#bfd1f3] pl-4 text-[#475467] italic",
  heading: {
    h1: "mb-4 mt-6 text-4xl font-semibold tracking-tight text-[#101828]",
    h2: "mb-3 mt-5 text-3xl font-semibold tracking-tight text-[#101828]",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
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
  code: "rounded-lg bg-[#f2f4f7] px-1.5 py-0.5 font-mono text-[13px]",
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
  link: "text-[#274690] underline underline-offset-2",
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
  const initialSerializedContent = normalizeSerializedContent(serializedContent);
  const documentMetrics = useMemo(() => getDocumentMetrics(serializedContent), [serializedContent]);
  const syncStateRef = useRef<SyncState>({
    isApplyingRemote: false,
    lastSerialized: initialSerializedContent,
  });

  const initialConfig = {
    namespace: `syncdocs-${documentId}`,
    editable: canEdit,
    theme: editorTheme,
    editorState: initialSerializedContent,
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
      ImageNode,
      TableNode,
      TableCellNode,
      TableRowNode,
    ],
  };

  return (
    <div className="relative overflow-hidden rounded-[28px] border border-[#e4e7ec] bg-[linear-gradient(180deg,#fcfdff_0%,#ffffff_14%)] shadow-[0_18px_34px_rgba(15,23,42,0.06)]">
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin canEdit={canEdit} />
        <EditorContentSync
          serializedContent={serializedContent}
          canEdit={canEdit}
          syncStateRef={syncStateRef}
          onSerializedChange={onSerializedChange}
          onCursorChange={onCursorChange}
        />

        <div className="border-b border-[#eef2f6] bg-[#fcfcfd] px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">
              {canEdit ? "Editing enabled" : "View only"}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#98a2b3]">
              Collaborative editor
            </span>
          </div>
        </div>

        <div className="relative min-h-[calc(100vh-7rem)] px-8 py-8 sm:px-10">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="syncdocs-editor-content min-h-[calc(100vh-10rem)] resize-none text-[16px] leading-8 text-[#1f2937] outline-none" />
            }
            placeholder={
              <div className="pointer-events-none absolute left-8 top-8 text-sm text-[#98a2b3] sm:left-10">
                Start writing your document
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

        <div className="border-t border-[#eef2f6] bg-[#fcfcfd] px-6 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[#667085]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">
                {documentMetrics.words} words
              </span>
              <span className="rounded-full bg-[#f2f4f7] px-3 py-1.5 font-medium text-[#344054]">
                {documentMetrics.characters} characters
              </span>
            </div>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-[#98a2b3]">Live document</span>
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
  const [textColor, setTextColor] = useState("#243640");
  const [highlightColor, setHighlightColor] = useState("#fff2a8");

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

            const anchorNode = selection.anchor.getNode();
            const colorSource = $isTextNode(anchorNode)
              ? anchorNode.getStyle()
              : anchorNode.getParent()?.getStyle?.() ?? "";
            const matchedColor = colorSource.match(/color:\s*([^;]+)/i)?.[1]?.trim() ?? "";
            setTextColor(isHexColor(matchedColor) ? matchedColor : "#243640");
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

  const applyTextColor = (nextColor: string) => {
    setTextColor(nextColor);

    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      $patchStyleText(selection, {
        color: nextColor,
      });
    });
  };

  const applyHighlightColor = (nextColor: string) => {
    setHighlightColor(nextColor);

    editor.update(() => {
      const selection = $getSelection();

      if (!$isRangeSelection(selection)) {
        return;
      }

      $patchStyleText(selection, {
        "background-color": nextColor,
      });
    });
  };

  const handleInsertImage = () => {
    const source = window.prompt("Paste an image URL");
    if (!source?.trim()) {
      return;
    }

    const altText = window.prompt("Add alt text for the image (optional)") ?? "";
    insertImage(editor, { src: source.trim(), altText: altText.trim() });
  };

  const handleUploadImage = () => {
    const input = window.document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) {
          return;
        }

        const altText = window.prompt("Add alt text for the image (optional)") ?? file.name;
        insertImage(editor, { src: result, altText: altText.trim() });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  };

  return (
    <div className="sticky top-0 z-10 border-b border-[#e4e7ec] bg-white/94 px-4 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3">
        <ToolbarGroup label="History">
          <ToolbarButton label="Undo" onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} disabled={!canEdit || !canUndo} />
          <ToolbarButton label="Redo" onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} disabled={!canEdit || !canRedo} />
        </ToolbarGroup>

        <ToolbarGroup label="Text">
          <ToolbarButton label="P" onClick={() => applyBlockType("paragraph")} disabled={!canEdit} />
          <ToolbarButton label="H1" onClick={() => applyBlockType("h1")} disabled={!canEdit} />
          <ToolbarButton label="H2" onClick={() => applyBlockType("h2")} disabled={!canEdit} />
          <ToolbarButton label="Quote" onClick={() => applyBlockType("quote")} disabled={!canEdit} />
          <ToolbarButton label="Code" onClick={() => applyBlockType("code")} disabled={!canEdit} />
        </ToolbarGroup>

        <ToolbarGroup label="Format">
          <ToolbarButton label="B" active={isBold} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")} disabled={!canEdit} />
          <ToolbarButton label="I" active={isItalic} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")} disabled={!canEdit} />
          <ToolbarButton label="U" active={isUnderline} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")} disabled={!canEdit} />
          <ToolbarButton label="S" active={isStrikethrough} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")} disabled={!canEdit} />
          <ToolbarButton label="Inline code" active={isCode} onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")} disabled={!canEdit} />
          <label className="flex items-center gap-2 rounded-xl border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-semibold text-[#475467]">
            Color
            <input
              type="color"
              value={textColor}
              onChange={(event) => applyTextColor(event.target.value)}
              disabled={!canEdit}
              className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              title="Change text color"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[#e4e7ec] bg-white px-3 py-2 text-xs font-semibold text-[#475467]">
            Highlight
            <input
              type="color"
              value={highlightColor}
              onChange={(event) => applyHighlightColor(event.target.value)}
              disabled={!canEdit}
              className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0 disabled:cursor-not-allowed"
              title="Highlight selected text"
            />
          </label>
        </ToolbarGroup>

        <ToolbarGroup label="Structure">
          <ToolbarButton label="Bullets" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)} disabled={!canEdit} />
          <ToolbarButton label="Numbers" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)} disabled={!canEdit} />
          <ToolbarButton label="Checklist" onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)} disabled={!canEdit} />
          <ToolbarButton label="Clear list" onClick={() => editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)} disabled={!canEdit} />
          <ToolbarButton
            label="Table"
            onClick={() =>
              editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: "3", rows: "3", includeHeaders: true })
            }
            disabled={!canEdit}
          />
        </ToolbarGroup>

        <ToolbarGroup label="Media">
          <ToolbarButton label="Link" onClick={toggleLink} disabled={!canEdit} />
          <ToolbarButton label="Image URL" onClick={handleInsertImage} disabled={!canEdit} />
          <ToolbarButton label="Upload image" onClick={handleUploadImage} disabled={!canEdit} />
        </ToolbarGroup>

        <ToolbarGroup label="Align">
          <ToolbarButton label="Left" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left")} disabled={!canEdit} />
          <ToolbarButton label="Center" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center")} disabled={!canEdit} />
          <ToolbarButton label="Right" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right")} disabled={!canEdit} />
          <ToolbarButton label="Justify" onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "justify")} disabled={!canEdit} />
        </ToolbarGroup>
      </div>
    </div>
  );
}

function ToolbarGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#e4e7ec] bg-[linear-gradient(180deg,#fcfcfd_0%,#f8fafc_100%)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <span className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#98a2b3]">{label}</span>
      {children}
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
      className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-[#111827] text-white shadow-[0_8px_16px_rgba(17,24,39,0.18)]"
          : "bg-white text-[#475467] hover:bg-[#eef2f7]"
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      {label}
    </button>
  );
}

function isHexColor(value?: string) {
  return Boolean(value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value));
}

function getDocumentMetrics(serializedContent: string) {
  const plainText = extractPlainText(serializedContent);
  const trimmedText = plainText.trim();

  return {
    words: trimmedText ? trimmedText.split(/\s+/).length : 0,
    characters: plainText.length,
  };
}

function extractPlainText(serializedContent: string) {
  if (!serializedContent) return "";

  try {
    const parsedContent = JSON.parse(serializedContent);
    const textParts: string[] = [];

    const walkNode = (node: unknown) => {
      if (!node || typeof node !== "object") return;

      const currentNode = node as { text?: string; children?: unknown[] };
      if (typeof currentNode.text === "string") {
        textParts.push(currentNode.text);
      }

      if (Array.isArray(currentNode.children)) {
        currentNode.children.forEach(walkNode);
      }
    };

    walkNode(parsedContent?.root);
    return textParts.join(" ").replace(/\s+/g, " ").trim();
  } catch {
    return serializedContent;
  }
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
