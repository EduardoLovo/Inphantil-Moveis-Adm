import "server-only";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatQuoteNumber, type MeasureType, type QuoteFull } from "@/lib/quote";
import type { SessionUser } from "@/lib/rbac";

export type QuoteListRow = {
  id: number;
  number: string;
  customerName: string;
  sellerName: string;
  total: number;
  itemsCount: number;
  createdAt: string;
};

/** Lista de orçamentos — SELLER vê os próprios; ADMIN/DEV veem todos. */
export async function listQuotes(user: SessionUser): Promise<QuoteListRow[]> {
  const where = user.role === Role.SELLER ? { sellerId: user.id } : {};
  const quotes = await prisma.quote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { seller: { select: { name: true } }, _count: { select: { items: true } } },
  });
  return quotes.map((q) => ({
    id: q.id,
    number: formatQuoteNumber(q.id),
    customerName: q.customerName,
    sellerName: q.seller.name,
    total: Number(q.total),
    itemsCount: q._count.items,
    createdAt: q.createdAt.toISOString(),
  }));
}

/** Orçamento completo (serializável) com checagem de permissão. */
export async function getQuoteFull(
  id: number,
  user: SessionUser,
): Promise<QuoteFull | null> {
  const q = await prisma.quote.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      seller: { select: { name: true } },
    },
  });
  if (!q) return null;
  // SELLER só acessa os próprios.
  if (user.role === Role.SELLER && q.sellerId !== user.id) return null;

  return {
    id: q.id,
    number: formatQuoteNumber(q.id),
    customerName: q.customerName,
    sellerName: q.seller.name,
    createdAt: q.createdAt.toISOString(),
    installments: q.installments,
    discountPercent: Number(q.discountPercent ?? 0),
    discountFixed: Number(q.discountFixed),
    oneInstallmentDiscount: q.oneInstallmentDiscount,
    shippingZipCode: q.shippingZipCode,
    shippingValue: Number(q.shippingValue),
    subtotal: Number(q.subtotal),
    discountValue: Number(q.discountValue),
    total: Number(q.total),
    items: q.items.map((i) => ({
      name: i.name,
      sku: i.sku,
      measureType: i.measureType as MeasureType,
      quantity: i.quantity,
      measure: i.measure != null ? Number(i.measure) : null,
      unitPrice: Number(i.unitPrice),
      lineTotal: Number(i.lineTotal),
      dimensions: i.dimensions,
      note: i.note,
    })),
  };
}
