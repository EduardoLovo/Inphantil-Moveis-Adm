import { z } from "zod";
import { CATEGORY_VALUES, PRONTA_KINDS } from "@/lib/catalog";

const emptyToNull = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? null : v;

const base = z.object({
  category: z.enum(CATEGORY_VALUES),
  code: z.string().trim().min(1, "Informe o código.").max(60),
  color: z.string().trim().min(1, "Informe a cor.").max(80),
  imageUrl: z.preprocess(emptyToNull, z.string().url().nullable()),
  imageKey: z.preprocess(emptyToNull, z.string().max(300).nullable()),
  available: z.boolean(),
  quantity: z.preprocess(emptyToNull, z.number().int().min(0).nullable()),
  fazExterno: z.boolean(),
  cabana: z.boolean(),
  apenasTapete: z.boolean(),
  prontaKind: z.preprocess(emptyToNull, z.enum(PRONTA_KINDS).nullable()),
});

function refine(d: z.infer<typeof base>, ctx: z.RefinementCtx) {
  if ((d.imageUrl && !d.imageKey) || (!d.imageUrl && d.imageKey)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Imagem inconsistente.", path: ["imageUrl"] });
  }
  if (d.category === "PRONTA_ENTREGA" && !d.prontaKind) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione o tipo (lençol, virol, fronha…).", path: ["prontaKind"] });
  }
  if ((d.category === "APLIQUE" || d.category === "PRONTA_ENTREGA") && d.quantity == null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Informe a quantidade.", path: ["quantity"] });
  }
}

export const createCatalogItemSchema = base.superRefine(refine);
export const updateCatalogItemSchema = base
  .extend({ id: z.string().min(1) })
  .superRefine(refine);

export type CatalogItemInput = z.infer<typeof base>;
