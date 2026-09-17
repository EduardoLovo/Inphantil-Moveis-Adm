import { z } from "zod";
import { UFS } from "@/lib/shipping";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const optStr = (max: number) =>
  z.preprocess(emptyToNull, z.string().trim().max(max).nullable());

const optNum = z.preprocess(
  emptyToNull,
  z.number().min(0).nullable(),
);
const optInt = z.preprocess(
  emptyToNull,
  z.number().int().min(0).nullable(),
);

// Solicitação (quem cria): CEP obrigatório, resto opcional.
export const createShippingQuoteSchema = z.object({
  quoteDetails: optStr(2000),
  customerName: optStr(150),
  customerCpf: optStr(14),
  customerZipCode: z.string().trim().min(8, "Informe o CEP.").max(10),
  customerAddress: optStr(255),
  customerCity: optStr(100),
  customerState: z.preprocess(
    emptyToNull,
    z.enum(UFS).nullable(),
  ),
});

// Cotação (admin): tudo opcional (superset da solicitação + campos do admin).
export const updateShippingQuoteSchema = z.object({
  id: z.number().int().positive(),
  quoteDetails: optStr(2000),
  customerName: optStr(150),
  customerCpf: optStr(14),
  customerZipCode: optStr(10),
  customerAddress: optStr(255),
  customerCity: optStr(100),
  customerState: z.preprocess(emptyToNull, z.enum(UFS).nullable()),

  carrierName: optStr(150),
  volumeQuantity: optInt,
  weight: optStr(50),
  shippingValue: optNum,
  orderValue: optNum,
  deliveryDeadline: optStr(50),
  hasWallProtector: z.boolean(),
  wallProtectorSize: optStr(200),
  hasRug: z.boolean(),
  rugSize: optStr(100),
  hasAccessories: z.boolean(),
  accessoryQuantity: optInt,
  bedSize: optStr(100),
  adminNotes: optStr(2000),
  isRequested: z.boolean(),
  isConcluded: z.boolean(),
});

export type CreateShippingQuoteInput = z.infer<typeof createShippingQuoteSchema>;
export type UpdateShippingQuoteInput = z.infer<typeof updateShippingQuoteSchema>;
