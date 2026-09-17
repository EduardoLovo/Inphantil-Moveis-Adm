import { z } from "zod";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** Validação de um File no cliente (drag & drop / input). */
export const imageFileSchema = z
  .instanceof(File, { message: "Selecione um arquivo." })
  .refine((f) => f.size > 0, "Arquivo vazio.")
  .refine((f) => f.size <= MAX_IMAGE_BYTES, "Imagem acima de 5 MB.")
  .refine(
    (f) => (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(f.type),
    "Formato não suportado (use JPG, PNG, WEBP ou AVIF).",
  );

/** Resultado do upload que o cliente devolve para persistir (a validação
 *  autoritativa de tamanho/tipo é feita no servidor via HEAD no R2). */
export const uploadResultSchema = z.object({
  key: z.string().min(1),
  url: z.string().url(),
});

export type UploadResult = z.infer<typeof uploadResultSchema>;
