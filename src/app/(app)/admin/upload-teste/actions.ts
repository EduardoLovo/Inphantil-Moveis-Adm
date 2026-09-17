"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { headObject, safeDestroy } from "@/lib/storage";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  uploadResultSchema,
} from "@/lib/validators/image";

const STAFF = [Role.DEV, Role.ADMIN];
const PATH = "/admin/upload-teste";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Verificação autoritativa no servidor: o objeto existe no R2 e respeita
 * tamanho/tipo? Se não, apaga e recusa (evita órfão e upload inválido).
 */
async function verifyObject(key: string): Promise<Result> {
  const meta = await headObject(key);
  if (!meta) return { ok: false, error: "Upload não encontrado no armazenamento." };
  if (meta.size > MAX_IMAGE_BYTES) {
    await safeDestroy(key, "verifyObject: acima do limite");
    return { ok: false, error: "Imagem acima de 5 MB." };
  }
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(meta.contentType)) {
    await safeDestroy(key, "verifyObject: tipo inválido");
    return { ok: false, error: "Formato não suportado." };
  }
  return { ok: true };
}

/** Persiste uma imagem recém-enviada ao R2. */
export async function persistImage(input: unknown): Promise<Result> {
  await requireRole(STAFF);

  const parsed = uploadResultSchema.safeParse(input);
  if (!parsed.success) {
    const key = (input as { key?: string })?.key;
    if (key) await safeDestroy(key, "persistImage: payload inválido");
    return { ok: false, error: "Retorno de upload inválido." };
  }

  const verified = await verifyObject(parsed.data.key);
  if (!verified.ok) return verified;

  try {
    await prisma.image.create({
      data: { url: parsed.data.url, key: parsed.data.key },
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch {
    await safeDestroy(parsed.data.key, "persistImage: erro no banco");
    return { ok: false, error: "Não foi possível salvar a imagem." };
  }
}

/**
 * Substitui a imagem: a NOVA já foi enviada ao R2 pelo cliente.
 * Atualiza o banco e SÓ ENTÃO apaga a antiga. Se o banco falhar, apaga a
 * nova e mantém a antiga intacta.
 */
export async function replaceImage(
  id: string,
  input: unknown,
): Promise<Result> {
  await requireRole(STAFF);

  const parsed = uploadResultSchema.safeParse(input);
  if (!parsed.success) {
    const key = (input as { key?: string })?.key;
    if (key) await safeDestroy(key, "replaceImage: payload inválido");
    return { ok: false, error: "Retorno de upload inválido." };
  }

  const verified = await verifyObject(parsed.data.key);
  if (!verified.ok) return verified;

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    await safeDestroy(parsed.data.key, "replaceImage: registro sumiu");
    return { ok: false, error: "Imagem não encontrada." };
  }

  const oldKey = existing.key;
  const isSame = oldKey === parsed.data.key;

  try {
    await prisma.image.update({
      where: { id },
      data: { url: parsed.data.url, key: parsed.data.key },
    });
  } catch {
    await safeDestroy(parsed.data.key, "replaceImage: erro no banco");
    return { ok: false, error: "Não foi possível substituir a imagem." };
  }

  // Banco OK → agora sim remove a antiga do R2.
  if (!isSame) await safeDestroy(oldKey, "replaceImage: substituída");

  revalidatePath(PATH);
  return { ok: true };
}

/** Exclui o registro e o objeto no R2. */
export async function deleteImage(id: string): Promise<Result> {
  await requireRole(STAFF);

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Imagem não encontrada." };

  try {
    await prisma.image.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }

  await safeDestroy(existing.key, "deleteImage");

  revalidatePath(PATH);
  return { ok: true };
}
