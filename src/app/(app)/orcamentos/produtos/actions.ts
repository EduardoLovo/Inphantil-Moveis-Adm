"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  createQuoteProductSchema,
  updateQuoteProductSchema,
} from "@/lib/validators/quote-product";

export type ActionResult = { ok: true } | { ok: false; error: string };

const STAFF = [Role.DEV, Role.ADMIN];
const PATH = "/orcamentos/produtos";

function normalize(input: {
  name: string;
  sku: string | null;
  measureType: "UNIDADE" | "METRO_LINEAR" | "METRO_QUADRADO";
  isPriceEditable: boolean;
  price: number | null;
  dimensions: string | null;
  isActive: boolean;
}) {
  return {
    name: input.name,
    sku: input.sku,
    measureType: input.measureType,
    isPriceEditable: input.isPriceEditable,
    // Produto de valor editável não guarda preço fixo.
    price: input.isPriceEditable ? null : input.price,
    dimensions: input.dimensions,
    isActive: input.isActive,
  };
}

function skuError(err: unknown): ActionResult | null {
  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    return { ok: false, error: "Já existe um produto com este SKU." };
  }
  return null;
}

export async function createQuoteProduct(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = createQuoteProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  try {
    await prisma.quoteProduct.create({ data: normalize(parsed.data) });
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return skuError(err) ?? { ok: false, error: "Não foi possível criar o produto." };
  }
}

export async function updateQuoteProduct(input: unknown): Promise<ActionResult> {
  await requireRole(STAFF);
  const parsed = updateQuoteProductSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const { id, ...rest } = parsed.data;
  try {
    await prisma.quoteProduct.update({ where: { id }, data: normalize(rest) });
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return skuError(err) ?? { ok: false, error: "Não foi possível salvar." };
  }
}

export async function setQuoteProductActive(
  id: number,
  isActive: boolean,
): Promise<ActionResult> {
  await requireRole(STAFF);
  try {
    await prisma.quoteProduct.update({ where: { id }, data: { isActive } });
    revalidatePath(PATH);
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível atualizar o status." };
  }
}
