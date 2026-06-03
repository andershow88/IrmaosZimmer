"use client";

import { explicarOrcamento } from "@/server/orcamentos";
import { ExplicarIA } from "./explicar-ia";

export function ExplicarIAWrapper({ quoteId }: { quoteId: string }) {
  return <ExplicarIA onExplicar={() => explicarOrcamento(quoteId)} />;
}
