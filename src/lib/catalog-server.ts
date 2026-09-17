import "server-only";
import { CatalogCategory, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  COLLECTIONS,
  type CatalogCategoryValue,
  type CatalogItemFull,
  type Collection,
  type ProntaKind,
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
  cabana: boolean;
  tapete: boolean;
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
    cabana: r.cabana,
    tapete: r.tapete,
    prontaKind: (r.prontaKind as ProntaKind | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function whereFor(c: Collection): Prisma.CatalogItemWhereInput {
  const where: Prisma.CatalogItemWhereInput = {
    category: c.category as CatalogCategory,
  };
  if (c.flag) where[c.flag] = true;
  return where;
}

export async function listCollection(c: Collection): Promise<CatalogItemFull[]> {
  const rows = await prisma.catalogItem.findMany({
    where: whereFor(c),
    orderBy: [{ available: "desc" }, { code: "asc" }],
  });
  return rows.map(toFull);
}

export async function countsByCollection(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    COLLECTIONS.map(async (c) => [c.slug, await prisma.catalogItem.count({ where: whereFor(c) })] as const),
  );
  return Object.fromEntries(entries);
}
