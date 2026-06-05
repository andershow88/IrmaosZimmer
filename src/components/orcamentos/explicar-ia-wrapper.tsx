"use client";

import { explicarOrcamento } from "@/server/orcamentos";
import { ExplicarIA } from "./explicar-ia";

export function ExplicarIAWrapper({
  quoteId,
  aiModel,
  aiDemo,
}: {
  quoteId: string;
  aiModel?: string;
  aiDemo?: boolean;
}) {
  return (
    <ExplicarIA
      onExplicar={() => explicarOrcamento(quoteId)}
      aiModel={aiModel}
      aiDemo={aiDemo}
    />
  );
}
