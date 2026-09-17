"use server";

import { createPresignedUpload, type PresignedUpload } from "@/lib/storage";
import { requireUser } from "@/lib/rbac";

/**
 * Gera uma URL pré-assinada (PUT) para o cliente enviar a imagem direto
 * ao R2. Exige sessão válida (qualquer papel). A persistência da URL é
 * feita depois pela action específica de cada entidade.
 */
export async function createUploadUrl(
  contentType: string,
): Promise<PresignedUpload> {
  await requireUser();
  return createPresignedUpload(contentType);
}
