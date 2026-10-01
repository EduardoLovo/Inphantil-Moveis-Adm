"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { getQuoteFull } from "@/lib/quotes-server";
import type { QuoteFull } from "@/lib/quote";
import { createQuoteSchema } from "@/lib/validators/quote";
import { buildItem, checkSellerDiscount, quoteFields, type ItemSource } from "@/lib/quote-save-server";

export async function getQuotePdfData(
  id: number,
): Promise<{ ok: true; quote: QuoteFull } | { ok: false; error: string }> {
  const user = await requireUser();
  const quote = await getQuoteFull(id, user);
  if (!quote) return { ok: false, error: "Orçamento não encontrado." };
  return { ok: true, quote };
}

/**
 * Atualiza um orçamento existente. Itens que já estavam salvos mantêm o
 * snapshot (nome/preço da época); produtos novos entram com o preço atual.
 */
export async function updateQuote(
  id: number,
  input: unknown,
): Promise<{ ok: true; quote: QuoteFull } | { ok: false; error: string }> {
  const user = await requireUser();

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dto = parsed.data;

  const current = await prisma.quote.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!current) return { ok: false, error: "Orçamento não encontrado." };
  if (user.role === Role.SELLER && current.sellerId !== user.id) {
    return { ok: false, error: "Você só pode editar os seus próprios orçamentos." };
  }

  const capError = checkSellerDiscount(user, dto, {
    discountPercent: Number(current.discountPercent ?? 0),
    discountFixed: Number(current.discountFixed),
  });
  if (capError) return { ok: false, error: capError };

  try {
    const existingById = new Map(current.items.map((i) => [i.id, i]));
    const ids = new Set<number>();
    for (const it of dto.items) {
      const pid = it.existingItemId
        ? existingById.get(it.existingItemId)?.quoteProductId
        : it.quoteProductId;
      if (pid != null) ids.add(pid);
    }
    const products = await prisma.quoteProduct.findMany({ where: { id: { in: [...ids] } } });
    const productById = new Map<number, ItemSource>(products.map((p) => [p.id, p]));

    const items = dto.items.map((it) => {
      if (it.existingItemId) {
        const saved = existingById.get(it.existingItemId);
        if (!saved) throw new Error("Item do orçamento não encontrado. Recarregue a página.");
        const product = saved.quoteProductId != null ? productById.get(saved.quoteProductId) : undefined;
        return buildItem(it, {
          id: saved.quoteProductId,
          sku: saved.sku,
          name: saved.name,
          price: saved.unitPrice,
          isPriceEditable: product?.isPriceEditable ?? false,
          measureType: saved.measureType,
          dimensions: saved.dimensions,
        });
      }
      return buildItem(it, it.quoteProductId != null ? productById.get(it.quoteProductId) : undefined);
    });

    await prisma.$transaction([
      prisma.quoteItem.deleteMany({ where: { quoteId: id } }),
      prisma.quote.update({
        where: { id },
        data: { ...quoteFields(dto, items), items: { create: items } },
      }),
    ]);

    revalidatePath("/orcamentos/lista");
    revalidatePath(`/orcamentos/${id}`);

    const quote = await getQuoteFull(id, user);
    if (!quote) return { ok: false, error: "Orçamento não encontrado." };
    return { ok: true, quote };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Não foi possível salvar o orçamento.",
    };
  }
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
