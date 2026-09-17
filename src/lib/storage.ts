import "server-only";
import { randomUUID } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/validators/image";

/**
 * Serviço central de imagens (Cloudflare R2, via API S3).
 *
 * REGRA CRÍTICA: todo upload/replace/destroy de qualquer entidade que
 * guarde imagem DEVE passar por aqui, para nunca deixar arquivo órfão.
 * - Upload: geramos uma URL pré-assinada (PUT) e o cliente envia direto
 *   ao R2; o servidor grava só a `key` + `url` pública.
 * - Substituir: sobe a nova → atualiza o banco → SÓ ENTÃO apaga a antiga.
 * - Excluir: remove o registro e depois apaga a(s) key(s).
 * - Se um delete falhar, registramos em OrphanImage para retry.
 */

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

let client: S3Client | null = null;
function s3(): S3Client {
  if (client) return client;
  const { endpoint, accessKeyId, secretAccessKey } = r2Env();
  client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  });
  return client;
}

export function publicUrl(key: string): string {
  return `${r2Env().publicBaseUrl}/${key}`;
}

export type PresignedUpload = {
  uploadUrl: string;
  key: string;
  url: string;
};

/**
 * Gera uma key única e a URL pré-assinada para upload direto do cliente.
 * Valida o content-type ANTES de assinar.
 */
export async function createPresignedUpload(
  contentType: string,
): Promise<PresignedUpload> {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(contentType)) {
    throw new Error("Tipo de imagem não suportado.");
  }
  const { bucket, folder } = r2Env();
  const ext = EXT_BY_TYPE[contentType] ?? "bin";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const uploadUrl = await getSignedUrl(
    s3(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: 60 },
  );

  return { uploadUrl, key, url: publicUrl(key) };
}

export type ObjectMeta = { size: number; contentType: string };

/** Lê metadados do objeto (para validar tamanho/tipo no servidor). */
export async function headObject(key: string): Promise<ObjectMeta | null> {
  try {
    const res = await s3().send(
      new HeadObjectCommand({ Bucket: r2Env().bucket, Key: key }),
    );
    return {
      size: res.ContentLength ?? 0,
      contentType: res.ContentType ?? "",
    };
  } catch {
    return null;
  }
}

/**
 * Apaga um objeto. NÃO lança: em falha, registra em OrphanImage p/ retry.
 * (No S3/R2 o delete é idempotente — apagar key inexistente é sucesso.)
 */
export async function safeDestroy(
  key: string,
  reason?: string,
): Promise<boolean> {
  if (!key) return true;
  try {
    await s3().send(
      new DeleteObjectCommand({ Bucket: r2Env().bucket, Key: key }),
    );
    return true;
  } catch (err) {
    await recordOrphan(
      key,
      reason ?? (err instanceof Error ? err.message : "erro desconhecido"),
    );
    return false;
  }
}

/** Apaga várias keys (ex.: entidade com múltiplas imagens). */
export async function safeDestroyMany(keys: string[]): Promise<void> {
  await Promise.all(keys.filter(Boolean).map((k) => safeDestroy(k)));
}

/** Lista todas as keys do bucket sob a pasta configurada. */
export async function listKeys(): Promise<string[]> {
  const { bucket, folder } = r2Env();
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const res = await s3().send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${folder}/`,
        ContinuationToken: token,
        MaxKeys: 1000,
      }),
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/** Registra uma key pendente de remoção (idempotente). */
async function recordOrphan(key: string, reason: string): Promise<void> {
  try {
    await prisma.orphanImage.upsert({
      where: { key },
      update: { reason, resolvedAt: null },
      create: { key, reason },
    });
  } catch {
    console.error("[storage] falha ao registrar OrphanImage:", key);
  }
}
