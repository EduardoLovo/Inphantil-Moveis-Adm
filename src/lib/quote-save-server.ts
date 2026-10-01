import "server-only";
import { Prisma, Role } from "@prisma/client";

import type { SessionUser } from "@/lib/rbac";
import type { CreateQuoteInput, QuoteItemPayload } from "@/lib/validators/quote";
import {
  computeQuoteMoney,
  round2,
  SELLER_MAX_DISCOUNT_FIXED,
  SELLER_MAX_DISCOUNT_PERCENT,
} from "@/lib/quote-pricing";

// Regras compartilhadas entre criar e editar orçamento.

/** Origem dos dados de um item: produto do catálogo ou snapshot já salvo. */
export type ItemSource = {
  id: number | null;
  sku: string | null;
  name: string;
  price: Prisma.Decimal | number | null;
  isPriceEditable: boolean;
  measureType: "UNIDADE" | "METRO_LINEAR" | "METRO_QUADRADO";
  dimensions: string | null;
};

/** Monta um item validando quantidade/medida e respeitando o preço da origem. */
export function buildItem(item: QuoteItemPayload, source: ItemSource | undefined) {
  if (!source) {
    throw new Error(`Produto ${item.quoteProductId ?? ""} não encontrado.`);
  }

  let unitPrice: number;
  if (source.isPriceEditable) {
    if (item.unitPrice == null || item.unitPrice <= 0) {
      throw new Error(`Informe o valor do produto "${source.name}".`);
    }
    unitPrice = round2(item.unitPrice);
  } else {
    if (source.price == null) {
      throw new Error(`Produto "${source.name}" está sem preço cadastrado.`);
    }
    unitPrice = round2(Number(source.price));
  }

  let quantity: number | null = null;
  let measure: number | null = null;
  let lineTotal: number;

  if (source.measureType === "UNIDADE") {
    if (!item.quantity || item.quantity < 1) {
      throw new Error(`Informe a quantidade do produto "${source.name}".`);
    }
    quantity = item.quantity;
    lineTotal = round2(unitPrice * quantity);
  } else {
    if (!item.measure || item.measure <= 0) {
      throw new Error(`Informe a medida (m) do produto "${source.name}".`);
    }
    measure = item.measure;
    lineTotal = round2(unitPrice * measure);
  }

  return {
    quoteProductId: source.id,
    sku: source.sku ?? "",
    name: source.name,
    measureType: source.measureType,
    unitPrice,
    quantity,
    measure,
    lineTotal,
    dimensions: source.dimensions ?? null,
    note: item.note?.trim() || null,
  };
}

/**
 * Tetos de desconto para vendedoras (ADMIN/DEV sem limite). Na edição, um
 * valor que já estava salvo (ex.: dado por um admin) é mantido sem bloquear.
 */
export function checkSellerDiscount(
  user: SessionUser,
  dto: Pick<CreateQuoteInput, "discountPercent" | "discountFixed">,
  current?: { discountPercent: number; discountFixed: number },
): string | null {
  if (user.role !== Role.SELLER) return null;
  const pct = dto.discountPercent ?? 0;
  const fix = dto.discountFixed ?? 0;
  if (pct > SELLER_MAX_DISCOUNT_PERCENT && pct !== current?.discountPercent) {
    return `Vendedoras podem dar no máximo ${SELLER_MAX_DISCOUNT_PERCENT}% de desconto à vista.`;
  }
  if (fix > SELLER_MAX_DISCOUNT_FIXED && fix !== current?.discountFixed) {
    return `Vendedoras podem dar no máximo R$ ${SELLER_MAX_DISCOUNT_FIXED} de desconto à vista.`;
  }
  return null;
}

/** Campos do orçamento (exceto itens e vendedora) a partir do DTO validado. */
export function quoteFields(
  dto: CreateQuoteInput,
  items: ReturnType<typeof buildItem>[],
) {
  const subtotal = round2(items.reduce((s, it) => s + it.lineTotal, 0));
  const money = computeQuoteMoney({
    subtotal,
    shippingValue: dto.shippingValue,
    discountPercent: dto.discountPercent,
    discountFixed: dto.discountFixed,
  });

  return {
    customerName: dto.customerName,
    installments: Math.min(10, Math.max(1, dto.installments ?? 1)),
    discountPercent: dto.discountPercent ?? 0,
    discountFixed: dto.discountFixed ?? 0,
    oneInstallmentDiscount: dto.oneInstallmentDiscount ?? false,
    shippingZipCode: dto.shippingZipCode || null,
    shippingValue: money.shippingValue,
    subtotal: money.subtotal,
    discountValue: money.discountValue,
    total: money.total,
  };
}
