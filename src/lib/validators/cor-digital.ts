import { z } from "zod";

const base = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "Informe o código.")
    .max(20)
    .transform((s) => s.toUpperCase()),
  cor: z.string().trim().min(1, "Informe a cor.").max(40),
  hex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Hex inválido (use o formato #aabbcc).")
    .transform((s) => s.toLowerCase()),
  ativa: z.boolean(),
});

export const createCorDigitalSchema = base;
export const updateCorDigitalSchema = base.extend({ id: z.string().min(1) });

export type CorDigitalInput = z.infer<typeof base>;
