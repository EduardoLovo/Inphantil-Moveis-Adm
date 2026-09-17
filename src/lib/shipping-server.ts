import "server-only";
import { Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { formatShippingNumber, type ShippingQuoteFull, type ShippingStatus } from "@/lib/shipping";
import type { SessionUser } from "@/lib/rbac";

export type ShippingFilters = {
  carrier?: string;
  city?: string;
  state?: string;
  status?: ShippingStatus;
};

export type ShippingListRow = {
  id: number;
  number: string;
  customerName: string | null;
  customerCity: string | null;
  customerState: string | null;
  carrierName: string | null;
  shippingValue: number | null;
  createdByName: string;
  isConcluded: boolean;
  isRequested: boolean;
  createdAt: string;
};

function buildWhere(user: SessionUser, f: ShippingFilters): Prisma.ShippingQuoteWhereInput {
  const where: Prisma.ShippingQuoteWhereInput = {};
  if (user.role === Role.SELLER) where.createdById = user.id;
  if (f.carrier) where.carrierName = { contains: f.carrier, mode: "insensitive" };
  if (f.city) where.customerCity = { contains: f.city, mode: "insensitive" };
  if (f.state) where.customerState = f.state.toUpperCase();
  if (f.status === "abertos") where.isConcluded = false;
  if (f.status === "concluidos") where.isConcluded = true;
  return where;
}

export async function listShippingQuotes(
  user: SessionUser,
  filters: ShippingFilters = {},
): Promise<ShippingListRow[]> {
  const rows = await prisma.shippingQuote.findMany({
    where: buildWhere(user, filters),
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    number: formatShippingNumber(r.id),
    customerName: r.customerName,
    customerCity: r.customerCity,
    customerState: r.customerState,
    carrierName: r.carrierName,
    shippingValue: r.shippingValue != null ? Number(r.shippingValue) : null,
    createdByName: r.createdBy.name,
    isConcluded: r.isConcluded,
    isRequested: r.isRequested,
    createdAt: r.createdAt.toISOString(),
  }));
}

/** Lista completa (todos os campos) para exportação, respeitando filtros/papel. */
export async function listShippingFull(
  user: SessionUser,
  filters: ShippingFilters = {},
): Promise<ShippingQuoteFull[]> {
  const rows = await prisma.shippingQuote.findMany({
    where: buildWhere(user, filters),
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    number: formatShippingNumber(r.id),
    createdAt: r.createdAt.toISOString(),
    createdByName: r.createdBy.name,
    quoteDetails: r.quoteDetails,
    customerName: r.customerName,
    customerCpf: r.customerCpf,
    customerZipCode: r.customerZipCode,
    customerAddress: r.customerAddress,
    customerCity: r.customerCity,
    customerState: r.customerState,
    carrierName: r.carrierName,
    volumeQuantity: r.volumeQuantity,
    weight: r.weight,
    shippingValue: r.shippingValue != null ? Number(r.shippingValue) : null,
    orderValue: r.orderValue != null ? Number(r.orderValue) : null,
    deliveryDeadline: r.deliveryDeadline,
    hasWallProtector: r.hasWallProtector,
    wallProtectorSize: r.wallProtectorSize,
    hasRug: r.hasRug,
    rugSize: r.rugSize,
    hasAccessories: r.hasAccessories,
    accessoryQuantity: r.accessoryQuantity,
    bedSize: r.bedSize,
    adminNotes: r.adminNotes,
    isRequested: r.isRequested,
    isConcluded: r.isConcluded,
    concludedAt: r.concludedAt ? r.concludedAt.toISOString() : null,
  }));
}

export async function getShippingQuote(
  id: number,
  user: SessionUser,
): Promise<ShippingQuoteFull | null> {
  const r = await prisma.shippingQuote.findUnique({
    where: { id },
    include: { createdBy: { select: { name: true } } },
  });
  if (!r) return null;
  if (user.role === Role.SELLER && r.createdById !== user.id) return null;

  return {
    id: r.id,
    number: formatShippingNumber(r.id),
    createdAt: r.createdAt.toISOString(),
    createdByName: r.createdBy.name,
    quoteDetails: r.quoteDetails,
    customerName: r.customerName,
    customerCpf: r.customerCpf,
    customerZipCode: r.customerZipCode,
    customerAddress: r.customerAddress,
    customerCity: r.customerCity,
    customerState: r.customerState,
    carrierName: r.carrierName,
    volumeQuantity: r.volumeQuantity,
    weight: r.weight,
    shippingValue: r.shippingValue != null ? Number(r.shippingValue) : null,
    orderValue: r.orderValue != null ? Number(r.orderValue) : null,
    deliveryDeadline: r.deliveryDeadline,
    hasWallProtector: r.hasWallProtector,
    wallProtectorSize: r.wallProtectorSize,
    hasRug: r.hasRug,
    rugSize: r.rugSize,
    hasAccessories: r.hasAccessories,
    accessoryQuantity: r.accessoryQuantity,
    bedSize: r.bedSize,
    adminNotes: r.adminNotes,
    isRequested: r.isRequested,
    isConcluded: r.isConcluded,
    concludedAt: r.concludedAt ? r.concludedAt.toISOString() : null,
  };
}
