"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { safeDestroy } from "@/lib/cloudinary";
import { uploadResultSchema } from "@/lib/validators/image";

const STAFF = [Role.DEV, Role.ADMIN];
const PATH = "/admin/upload-teste";

type Result = { ok: true } | { ok: false; error: string };

/** Persiste uma imagem recém-enviada ao Cloudinary. */
export async function persistImage(input: unknown): Promise<Result> {
  await requireRole(STAFF);

  const parsed = uploadResultSchema.safeParse(input);
  if (!parsed.success) {
    // Dado inválido: não deixamos o arquivo enviado virar órfão.
    const publicId = (input as { publicId?: string })?.publicId;
    if (publicId) await safeDestroy(publicId, "persistImage: payload inválido");
    return { ok: false, error: "Retorno de upload inválido." };
  }

  try {
    await prisma.image.create({
      data: { url: parsed.data.url, publicId: parsed.data.publicId },
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch {
    // Falhou ao gravar → remove o arquivo já enviado (evita órfão).
    await safeDestroy(parsed.data.publicId, "persistImage: erro no banco");
    return { ok: false, error: "Não foi possível salvar a imagem." };
  }
}

/**
 * Substitui a imagem: a NOVA já foi enviada ao Cloudinary pelo cliente.
 * Atualiza o banco e SÓ ENTÃO destrói a antiga. Se o banco falhar,
 * destrói a nova e mantém a antiga intacta.
 */
export async function replaceImage(
  id: string,
  input: unknown,
): Promise<Result> {
  await requireRole(STAFF);

  const parsed = uploadResultSchema.safeParse(input);
  if (!parsed.success) {
    const publicId = (input as { publicId?: string })?.publicId;
    if (publicId) await safeDestroy(publicId, "replaceImage: payload inválido");
    return { ok: false, error: "Retorno de upload inválido." };
  }

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) {
    await safeDestroy(parsed.data.publicId, "replaceImage: registro sumiu");
    return { ok: false, error: "Imagem não encontrada." };
  }

  const oldPublicId = existing.publicId;
  const isSame = oldPublicId === parsed.data.publicId;

  try {
    await prisma.image.update({
      where: { id },
      data: { url: parsed.data.url, publicId: parsed.data.publicId },
    });
  } catch {
    await safeDestroy(parsed.data.publicId, "replaceImage: erro no banco");
    return { ok: false, error: "Não foi possível substituir a imagem." };
  }

  // Banco OK → agora sim remove a antiga do Cloudinary.
  if (!isSame) await safeDestroy(oldPublicId, "replaceImage: substituída");

  revalidatePath(PATH);
  return { ok: true };
}

/** Exclui o registro e o(s) arquivo(s) no Cloudinary. */
export async function deleteImage(id: string): Promise<Result> {
  await requireRole(STAFF);

  const existing = await prisma.image.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Imagem não encontrada." };

  try {
    await prisma.image.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }

  // Após remover do banco, limpa o Cloudinary (registra órfão se falhar).
  await safeDestroy(existing.publicId, "deleteImage");

  revalidatePath(PATH);
  return { ok: true };
}
