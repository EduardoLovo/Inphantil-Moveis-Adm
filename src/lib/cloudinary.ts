import "server-only";
import { v2 as cloudinary } from "cloudinary";

import { cloudinaryEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

/**
 * Serviço central de imagens (Cloudinary).
 *
 * REGRA CRÍTICA: todo upload/replace/destroy de qualquer entidade que
 * guarde imagem DEVE passar por aqui, para nunca deixar arquivo órfão.
 * - Ao SUBSTITUIR: suba a nova, grave no banco e SÓ ENTÃO destrua a antiga.
 * - Ao EXCLUIR o dono: destrua todos os public_ids.
 * - Se o destroy falhar, registramos em OrphanImage para retry (a operação
 *   do usuário NÃO quebra por causa disso).
 */

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const { cloudName, apiKey, apiSecret } = cloudinaryEnv();
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  configured = true;
}

export type UploadSignature = {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Gera a assinatura para um upload direto do cliente ao Cloudinary.
 * Os parâmetros assinados aqui DEVEM ser exatamente os enviados pelo
 * cliente no POST de upload.
 */
export function signUpload(): UploadSignature {
  ensureConfigured();
  const { cloudName, apiKey, apiSecret, folder } = cloudinaryEnv();
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );

  return { timestamp, signature, apiKey, cloudName, folder };
}

/**
 * Destrói um public_id no Cloudinary. Retorna true em caso de sucesso.
 * NÃO lança: em falha, registra o pendente em OrphanImage para retry.
 */
export async function safeDestroy(
  publicId: string,
  reason?: string,
): Promise<boolean> {
  if (!publicId) return true;
  try {
    ensureConfigured();
    const res = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });
    // "ok" ou "not found" contam como resolvido (não há mais arquivo).
    if (res.result === "ok" || res.result === "not found") {
      return true;
    }
    await recordOrphan(publicId, `destroy retornou "${res.result}"`);
    return false;
  } catch (err) {
    await recordOrphan(
      publicId,
      reason ?? (err instanceof Error ? err.message : "erro desconhecido"),
    );
    return false;
  }
}

/** Destrói vários public_ids (ex.: entidade com múltiplas imagens). */
export async function safeDestroyMany(publicIds: string[]): Promise<void> {
  await Promise.all(publicIds.filter(Boolean).map((id) => safeDestroy(id)));
}

/** Registra um public_id pendente de remoção (idempotente). */
async function recordOrphan(publicId: string, reason: string): Promise<void> {
  try {
    await prisma.orphanImage.upsert({
      where: { publicId },
      update: { reason, resolvedAt: null },
      create: { publicId, reason },
    });
  } catch {
    // Se nem o log der certo, não podemos quebrar a operação do usuário.
    console.error("[cloudinary] falha ao registrar OrphanImage:", publicId);
  }
}

export { cloudinary };
