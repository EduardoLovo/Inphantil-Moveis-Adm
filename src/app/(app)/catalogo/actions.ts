"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { safeDestroy } from "@/lib/storage";
import { COLLECTIONS } from "@/lib/catalog";
import {
  createCatalogItemSchema,
  updateCatalogItemSchema,
  type CatalogItemInput,
} from "@/lib/validators/catalog";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STAFF = [Role.DEV, Role.ADMIN];

function normalize(d: CatalogItemInput) {
  const isAplique = d.category === "APLIQUE";
  const isPronta = d.category === "PRONTA_ENTREGA";
  const isSintetico = d.category === "SINTETICO";
  return {
    category: d.category,
    code: d.code,
    color: d.color,
    imageUrl: d.imageUrl,
    imageKey: d.imageKey,
    available: d.available,
    quantity: isAplique || isPronta ? d.quantity : null,
    fazExterno: isSintetico ? d.fazExterno : false,
    cabana: isAplique ? d.cabana : false,
    tapete: isSintetico ? d.tapete : false,
    prontaKind: isPronta ? d.prontaKind : null,
  };
}

function revalidate(category: string) {
  revalidatePath("/catalogo");
  // Revalida todas as coleções que exibem essa categoria (base + filtradas).
  for (const c of COLLECTIONS) {
    if (c.category === category) revalidatePath(`/catalogo/${c.slug}`);
  }
}

export async function createCatalogItem(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = createCatalogItemSchema.safeParse(input);
  if (!parsed.success) {
    const key = (input as { imageKey?: string })?.imageKey;
    if (key) await safeDestroy(key, "createCatalogItem: payload inválido");
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    await prisma.catalogItem.create({ data: normalize(parsed.data) });
    revalidate(parsed.data.category);
    return { ok: true };
  } catch {
    if (parsed.data.imageKey) await safeDestroy(parsed.data.imageKey, "createCatalogItem: erro no banco");
    return { ok: false, error: "Não foi possível criar o item." };
  }
}

export async function updateCatalogItem(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = updateCatalogItemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, ...rest } = parsed.data;

  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Item não encontrado." };

  try {
    await prisma.catalogItem.update({ where: { id }, data: normalize(rest) });
  } catch {
    return { ok: false, error: "Não foi possível salvar." };
  }

  // Imagem trocada/removida → apaga a antiga do R2 (só depois do commit).
  if (existing.imageKey && existing.imageKey !== rest.imageKey) {
    await safeDestroy(existing.imageKey, "updateCatalogItem: imagem substituída");
  }

  revalidate(rest.category);
  return { ok: true };
}

export async function deleteCatalogItem(id: string): Promise<ActionResult> {
  await requireRole(STAFF);
  const existing = await prisma.catalogItem.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Item não encontrado." };
  try {
    await prisma.catalogItem.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
  if (existing.imageKey) await safeDestroy(existing.imageKey, "deleteCatalogItem");
  revalidate(existing.category);
  return { ok: true };
}

export async function setCatalogItemAvailable(
  id: string,
  available: boolean,
): Promise<ActionResult> {
  await requireRole(STAFF);
  try {
    const updated = await prisma.catalogItem.update({
      where: { id },
      data: { available },
    });
    revalidate(updated.category);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar." };
  }
}
