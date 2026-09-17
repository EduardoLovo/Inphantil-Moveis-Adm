"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { getQuoteFull } from "@/lib/quotes-server";
import type { QuoteFull } from "@/lib/quote";

export async function getQuotePdfData(
  id: number,
): Promise<{ ok: true; quote: QuoteFull } | { ok: false; error: string }> {
  const user = await requireUser();
  const quote = await getQuoteFull(id, user);
  if (!quote) return { ok: false, error: "Orçamento não encontrado." };
  return { ok: true, quote };
}

export async function deleteQuote(
  id: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();

  const quote = await prisma.quote.findUnique({
    where: { id },
    select: { sellerId: true },
  });
  if (!quote) return { ok: false, error: "Orçamento não encontrado." };
  if (user.role === Role.SELLER && quote.sellerId !== user.id) {
    return { ok: false, error: "Você só pode excluir os seus próprios orçamentos." };
  }

  try {
    await prisma.quote.delete({ where: { id } });
    revalidatePath("/orcamentos/lista");
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível excluir." };
  }
}
