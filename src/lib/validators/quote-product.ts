import { z } from "zod";
import { MEASURE_TYPES } from "@/lib/quote";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

export const quoteProductSchema = z
  .object({
    name: z.string().trim().min(2, "Nome muito curto.").max(200),
    sku: z.preprocess(
      emptyToNull,
      z.string().trim().max(50).nullable(),
    ),
    measureType: z.enum(MEASURE_TYPES),
    isPriceEditable: z.boolean(),
    price: z.preprocess(
      emptyToNull,
      z
        .number({ invalid_type_error: "Preço inválido." })
        .positive("Preço deve ser maior que zero.")
        .max(99_999_999)
        .nullable(),
    ),
    dimensions: z.preprocess(
      emptyToNull,
      z.string().trim().max(100).nullable(),
    ),
    isActive: z.boolean(),
  })
  .refine((d) => d.isPriceEditable || (d.price != null && d.price > 0), {
    message: "Informe o preço, ou marque “valor editável”.",
    path: ["price"],
  });

export const createQuoteProductSchema = quoteProductSchema;

export const updateQuoteProductSchema = z.intersection(
  z.object({ id: z.number().int().positive() }),
  quoteProductSchema,
);

export type QuoteProductInput = z.infer<typeof quoteProductSchema>;
