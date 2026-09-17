"use server";

import { signUpload, type UploadSignature } from "@/lib/cloudinary";
import { requireUser } from "@/lib/rbac";

/**
 * Gera uma assinatura de upload para o Cloudinary.
 * Exige apenas sessão válida (qualquer papel) — a persistência da URL é
 * feita depois pela action específica de cada entidade.
 */
export async function createUploadSignature(): Promise<UploadSignature> {
  await requireUser();
  return signUpload();
}
