"use client";

import { Fragment, type ReactNode } from "react";

/**
 * Renderizador de Markdown mínimo e seguro (sem dependências externas).
 * Suporta: negrito (**texto**), itálico (_texto_ / *texto*), código inline
 * (`code`), títulos (#, ##, ###) e listas com "-". Tudo via texto puro,
 * sem dangerouslySetInnerHTML.
 */

function renderInline(text: string, keyBase: string): ReactNode[] {
  // Quebra em tokens de **negrito**, _itálico_, *itálico* e `código`.
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_|\*[^*]+\*)/g;
  const parts = text.split(regex).filter((p) => p !== "");
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={key} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      (part.startsWith("_") && part.endsWith("_")) ||
      (part.startsWith("*") && part.endsWith("*"))
    ) {
      return (
        <em key={key} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (!listBuffer.length) return;
    const items = listBuffer.slice();
    listBuffer = [];
    blocks.push(
      <ul key={key} className="my-1.5 ml-4 list-disc space-y-1">
        {items.map((item, i) => (
          <li key={`${key}-${i}`}>{renderInline(item, `${key}-${i}`)}</li>
        ))}
      </ul>
    );
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();
    const key = `b-${idx}`;

    if (/^\s*[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^\s*[-*]\s+/, ""));
      return;
    }
    flushList(`${key}-list`);

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={key} className="mt-2 mb-1 text-sm font-bold text-foreground">
          {renderInline(line.slice(4), key)}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      blocks.push(
        <h3 key={key} className="mt-2 mb-1 text-sm font-bold text-foreground">
          {renderInline(line.slice(3), key)}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h2 key={key} className="mt-2 mb-1 text-base font-bold text-foreground">
          {renderInline(line.slice(2), key)}
        </h2>
      );
    } else if (line.trim() === "") {
      // espaço entre parágrafos — ignorado, o gap cuida do espaçamento.
    } else {
      blocks.push(
        <p key={key} className="my-0.5 leading-relaxed">
          {renderInline(line, key)}
        </p>
      );
    }
  });

  flushList("b-final-list");

  return <div className="space-y-1 text-sm text-foreground">{blocks}</div>;
}
