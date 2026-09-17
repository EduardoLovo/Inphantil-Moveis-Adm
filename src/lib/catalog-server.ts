import "server-only";
import { CatalogCategory } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type {
  CatalogCategoryValue,
  CatalogItemFull,
  ProntaKind,
} from "@/lib/catalog";

type Row = {
  id: string;
  category: CatalogCategory;
  code: string;
  color: string;
  imageUrl: string | null;
  imageKey: string | null;
  available: boolean;
  quantity: number | null;
  fazExterno: boolean;
  prontaKind: string | null;
  createdAt: Date;
};

function toFull(r: Row): CatalogItemFull {
  return {
    id: r.id,
    category: r.category as CatalogCategoryValue,
    code: r.code,
    color: r.color,
    imageUrl: r.imageUrl,
    imageKey: r.imageKey,
    available: r.available,
    quantity: r.quantity,
    fazExterno: r.fazExterno,
    prontaKind: (r.prontaKind as ProntaKind | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function listCatalog(
  category: CatalogCategoryValue,
): Promise<CatalogItemFull[]> {
  const rows = await prisma.catalogItem.findMany({
    where: { category: category as CatalogCategory },
    orderBy: [{ available: "desc" }, { code: "asc" }],
  });
  return rows.map(toFull);
}

export async function countsByCategory(): Promise<Record<string, number>> {
  const grouped = await prisma.catalogItem.groupBy({
    by: ["category"],
    _count: { _all: true },
  });
  const out: Record<string, number> = {};
  for (const g of grouped) out[g.category] = g._count._all;
  return out;
}
