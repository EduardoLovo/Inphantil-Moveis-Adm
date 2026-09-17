// Constantes de orçamento client-safe (sem dependência de Prisma/servidor).

export const MEASURE_TYPES = [
  "UNIDADE",
  "METRO_LINEAR",
  "METRO_QUADRADO",
] as const;

export type MeasureType = (typeof MEASURE_TYPES)[number];

export const MEASURE_LABEL: Record<MeasureType, string> = {
  UNIDADE: "Unidade",
  METRO_LINEAR: "Metro linear",
  METRO_QUADRADO: "Metro quadrado",
};

/** Número humano do orçamento, derivado do id (estável, não editável). */
export function formatQuoteNumber(id: number): string {
  return `ORC-${String(id).padStart(5, "0")}`;
}
