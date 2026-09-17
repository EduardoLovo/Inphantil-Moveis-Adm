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

// Formas serializáveis (server → client) de um orçamento completo.
export type QuoteItemFull = {
  name: string;
  sku: string;
  measureType: MeasureType;
  quantity: number | null;
  measure: number | null;
  unitPrice: number;
  lineTotal: number;
  dimensions: string | null;
  note: string | null;
};

export type QuoteFull = {
  id: number;
  number: string;
  customerName: string;
  sellerName: string;
  createdAt: string;
  installments: number | null;
  discountPercent: number;
  discountFixed: number;
  oneInstallmentDiscount: boolean;
  shippingZipCode: string | null;
  shippingValue: number;
  subtotal: number;
  discountValue: number;
  total: number;
  items: QuoteItemFull[];
};
