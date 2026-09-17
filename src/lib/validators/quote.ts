import { z } from "zod";

export const quoteItemPayloadSchema = z.object({
  quoteProductId: z.number().int().positive(),
  quantity: z.number().int().positive().optional(),
  measure: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(), // só produtos de valor editável
  note: z.string().trim().max(500).optional(),
});

export const createQuoteSchema = z.object({
  customerName: z.string().trim().min(2, "Informe o nome do cliente.").max(200),
  items: z.array(quoteItemPayloadSchema).min(1, "Adicione ao menos um produto."),
  discountPercent: z.number().min(0).max(100).optional(),
  discountFixed: z.number().min(0).optional(),
  oneInstallmentDiscount: z.boolean().optional(),
  installments: z.number().int().min(1).max(10).optional(),
  shippingZipCode: z.string().trim().max(10).optional(),
  shippingValue: z.number().min(0).optional(),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
export type QuoteItemPayload = z.infer<typeof quoteItemPayloadSchema>;
