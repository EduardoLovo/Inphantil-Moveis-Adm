"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { createQuoteSchema } from "@/lib/validators/quote";
import { formatQuoteNumber } from "@/lib/quote";
import {
  buildItem,
  checkSellerDiscount,
  quoteFields,
  type ItemSource,
} from "@/lib/quote-save-server";

export type CreateResult =
  | { ok: true; id: number; number: string }
  | { ok: false; error: string };

export async function createQuote(input: unknown): Promise<CreateResult> {
  const user = await requireUser();

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dto = parsed.data;

  const capError = checkSellerDiscount(user, dto);
  if (capError) return { ok: false, error: capError };

  try {
    const ids = [...new Set(dto.items.flatMap((i) => i.quoteProductId ?? []))];
    const products = await prisma.quoteProduct.findMany({ where: { id: { in: ids } } });
    const byId = new Map<number, ItemSource>(products.map((p) => [p.id, p]));

    const items = dto.items.map((it) =>
      buildItem(it, it.quoteProductId != null ? byId.get(it.quoteProductId) : undefined),
    );

    const quote = await prisma.quote.create({
      data: {
        ...quoteFields(dto, items),
        sellerId: user.id,
        items: { create: items },
      },
    });

    revalidatePath("/orcamentos");
    return { ok: true, id: quote.id, number: formatQuoteNumber(quote.id) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Não foi possível criar o orçamento.",
    };
  }
}
