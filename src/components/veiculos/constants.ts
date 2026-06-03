import type { Combustivel } from "@prisma/client";

/** Rótulos em pt-BR para o enum Combustivel. */
export const COMBUSTIVEL_LABELS: Record<Combustivel, string> = {
  GASOLINA: "Gasolina",
  ETANOL: "Etanol",
  FLEX: "Flex",
  DIESEL: "Diesel",
  GNV: "GNV",
  ELETRICO: "Elétrico",
  HIBRIDO: "Híbrido",
};

export const COMBUSTIVEL_OPTIONS = (
  Object.keys(COMBUSTIVEL_LABELS) as Combustivel[]
).map((value) => ({ value, label: COMBUSTIVEL_LABELS[value] }));
