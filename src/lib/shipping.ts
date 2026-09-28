// Constantes/tipos de frete client-safe (sem dependência de servidor).

/** Número humano da solicitação de frete. */
export function formatShippingNumber(id: number): string {
  return `FR-${String(id).padStart(5, "0")}`;
}

export const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;

export type ShippingQuoteFull = {
  id: number;
  number: string;
  createdAt: string;
  createdByName: string;
  // solicitação
  quoteDetails: string | null;
  customerName: string | null;
  customerCpf: string | null;
  customerZipCode: string | null;
  customerAddress: string | null;
  customerCity: string | null;
  customerState: string | null;
  // cotação
  carrierName: string | null;
  volumeQuantity: number | null;
  weight: string | null;
  shippingValue: number | null;
  orderValue: number | null;
  deliveryDeadline: string | null;
  hasWallProtector: boolean;
  wallProtectorSize: string | null;
  hasRug: boolean;
  rugSize: string | null;
  hasAccessories: boolean;
  accessoryQuantity: number | null;
  bedSize: string | null;
  adminNotes: string | null;
  // estado
  isRequested: boolean;
  isConcluded: boolean;
  concludedAt: string | null;
};

export type ShippingStatus = "todos" | "abertos" | "concluidos";
