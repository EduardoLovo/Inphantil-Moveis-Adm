"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/rbac";
import { createQuoteSchema } from "@/lib/validators/quote";
import { formatQuoteNumber } from "@/lib/quote";
import {
  computeQuoteMoney,
  round2,
  SELLER_MAX_DISCOUNT_FIXED,
  SELLER_MAX_DISCOUNT_PERCENT,
} from "@/lib/quote-pricing";
import type { QuoteItemPayload } from "@/lib/validators/quote";

export type CreateResult =
  | { ok: true; id: number; number: string }
  | { ok: false; error: string };

type ProductLite = {
  id: number;
  sku: string | null;
  name: string;
  price: Prisma.Decimal | null;
  isPriceEditable: boolean;
  measureType: "UNIDADE" | "METRO_LINEAR" | "METRO_QUADRADO";
  dimensions: string | null;
};

/** Monta um item validando quantidade/medida e respeitando o preço do catálogo. */
function buildItem(item: QuoteItemPayload, product: ProductLite | undefined) {
  if (!product) {
    throw new Error(`Produto ${item.quoteProductId} não encontrado.`);
  }

  let unitPrice: number;
  if (product.isPriceEditable) {
    if (item.unitPrice == null || item.unitPrice <= 0) {
      throw new Error(`Informe o valor do produto "${product.name}".`);
    }
    unitPrice = round2(item.unitPrice);
  } else {
    if (product.price == null) {
      throw new Error(`Produto "${product.name}" está sem preço cadastrado.`);
    }
    unitPrice = round2(Number(product.price));
  }

  let quantity: number | null = null;
  let measure: number | null = null;
  let lineTotal: number;

  if (product.measureType === "UNIDADE") {
    if (!item.quantity || item.quantity < 1) {
      throw new Error(`Informe a quantidade do produto "${product.name}".`);
    }
    quantity = item.quantity;
    lineTotal = round2(unitPrice * quantity);
  } else {
    if (!item.measure || item.measure <= 0) {
      throw new Error(`Informe a medida (m) do produto "${product.name}".`);
    }
    measure = item.measure;
    lineTotal = round2(unitPrice * measure);
  }

  return {
    quoteProductId: product.id,
    sku: product.sku ?? "",
    name: product.name,
    measureType: product.measureType,
    unitPrice,
    quantity,
    measure,
    lineTotal,
    dimensions: product.dimensions ?? null,
    note: item.note?.trim() || null,
  };
}

export async function createQuote(input: unknown): Promise<CreateResult> {
  const user = await requireUser();

  const parsed = createQuoteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const dto = parsed.data;

  // Tetos de desconto para vendedoras (ADMIN/DEV sem limite).
  if (user.role === Role.SELLER) {
    if ((dto.discountPercent ?? 0) > SELLER_MAX_DISCOUNT_PERCENT) {
      return { ok: false, error: `Vendedoras podem dar no máximo ${SELLER_MAX_DISCOUNT_PERCENT}% de desconto à vista.` };
    }
    if ((dto.discountFixed ?? 0) > SELLER_MAX_DISCOUNT_FIXED) {
      return { ok: false, error: `Vendedoras podem dar no máximo R$ ${SELLER_MAX_DISCOUNT_FIXED} de desconto à vista.` };
    }
  }

  try {
    const ids = [...new Set(dto.items.map((i) => i.quoteProductId))];
    const products = await prisma.quoteProduct.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((p) => [p.id, p as ProductLite]));

    const items = dto.items.map((it) => buildItem(it, byId.get(it.quoteProductId)));
    const subtotal = round2(items.reduce((s, it) => s + it.lineTotal, 0));

    const money = computeQuoteMoney({
      subtotal,
      shippingValue: dto.shippingValue,
      discountPercent: dto.discountPercent,
      discountFixed: dto.discountFixed,
    });

    const installments = Math.min(10, Math.max(1, dto.installments ?? 1));

    const quote = await prisma.quote.create({
      data: {
        customerName: dto.customerName,
        sellerId: user.id,
        installments,
        discountPercent: dto.discountPercent ?? 0,
        discountFixed: dto.discountFixed ?? 0,
        oneInstallmentDiscount: dto.oneInstallmentDiscount ?? false,
        shippingZipCode: dto.shippingZipCode || null,
        shippingValue: money.shippingValue,
        subtotal: money.subtotal,
        discountValue: money.discountValue,
        total: money.total,
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
