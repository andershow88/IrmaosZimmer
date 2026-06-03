import { CategoriaServico } from "@prisma/client";

export const CATEGORIA_LABELS: Record<CategoriaServico, string> = {
  MECANICA_GERAL: "Mecânica geral",
  ELETRONICA_EMBARCADA: "Eletrônica embarcada",
  SERVICOS_RAPIDOS: "Serviços rápidos",
  GEOMETRIA: "Geometria",
  CHAPEACAO: "Chapeação",
  AUTOPECAS: "Autopeças",
  ACESSORIOS: "Acessórios",
  FREIOS: "Freios",
  SUSPENSAO: "Suspensão",
  MOTOR: "Motor",
  ARREFECIMENTO: "Arrefecimento",
};

export const CATEGORIA_OPTIONS = (
  Object.keys(CATEGORIA_LABELS) as CategoriaServico[]
).map((value) => ({ value, label: CATEGORIA_LABELS[value] }));

/** Formata minutos como "1h 30min" / "45min" / "—". */
export function formatTempoEstimado(min: number | null | undefined): string {
  if (min == null || min <= 0) return "—";
  const horas = Math.floor(min / 60);
  const minutos = min % 60;
  if (horas === 0) return `${minutos}min`;
  if (minutos === 0) return `${horas}h`;
  return `${horas}h ${minutos}min`;
}
