import type { ReactElement } from "react";
import { DecoratorNode, type LexicalEditor, type NodeKey, type SerializedLexicalNode, $insertNodes } from "lexical";

export type SerializedImageNode = SerializedLexicalNode & {
  altText: string;
  src: string;
  type: "image";
  version: 1;
};

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;

  static getType() {
    return "image";
  }

  static clone(node: ImageNode) {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  static importJSON(serializedNode: SerializedImageNode) {
    return new ImageNode(serializedNode.src, serializedNode.altText);
  }

  constructor(src: string, altText = "", key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      src: this.__src,
      type: "image",
      version: 1,
    };
  }

  createDOM(): HTMLElement {
    const element = document.createElement("div");
    element.className = "my-6";
    return element;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): ReactElement {
    return (
      <figure className="my-6 overflow-hidden rounded-[18px] border border-[#e8e6e1] bg-[#fbfbfa] p-3">
        <img
          src={this.__src}
          alt={this.__altText || "Document image"}
          className="h-auto max-w-full rounded-[14px] object-contain"
        />
        {this.__altText ? <figcaption className="mt-3 text-sm text-[#787774]">{this.__altText}</figcaption> : null}
      </figure>
    );
  }
}

export function $createImageNode(src: string, altText = "") {
  return new ImageNode(src, altText);
}

export function insertImage(editor: LexicalEditor, payload: { src: string; altText?: string }) {
  editor.update(() => {
    $insertNodes([$createImageNode(payload.src, payload.altText ?? "")]);
  });
}
