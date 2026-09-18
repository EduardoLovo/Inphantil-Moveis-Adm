import "server-only";
import { CatalogCategory, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  COLLECTIONS,
  type CatalogCategoryValue,
  type CatalogItemFull,
  type Collection,
  type ProntaKind,
  type ProntaTamanho,
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
  apenasTapete: boolean;
  prontaKind: string | null;
  tamanho: string | null;
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
    apenasTapete: r.apenasTapete,
    prontaKind: (r.prontaKind as ProntaKind | null) ?? null,
    tamanho: (r.tamanho as ProntaTamanho | null) ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

function whereFor(
  c: Collection,
  scope: "manage" | "public",
): Prisma.CatalogItemWhereInput {
  const where: Prisma.CatalogItemWhereInput = {
    category: c.category as CatalogCategory,
    ...c.filter,
  };
  // Filtro exclusivo do mostruário (a gestão vê a categoria inteira).
  if (scope === "public") Object.assign(where, c.publicFilter);
  return where;
}

export async function listCollection(c: Collection): Promise<CatalogItemFull[]> {
  const rows = await prisma.catalogItem.findMany({
    where: whereFor(c, "manage"),
    orderBy: [{ available: "desc" }, { code: "asc" }],
  });
  return rows.map(toFull);
}

export async function countsByCollection(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    COLLECTIONS.map(async (c) => [c.slug, await prisma.catalogItem.count({ where: whereFor(c, "manage") })] as const),
  );
  return Object.fromEntries(entries);
}

// ── Vitrine pública: somente itens disponíveis ──────────────

export async function listPublicCollection(c: Collection): Promise<CatalogItemFull[]> {
  const rows = await prisma.catalogItem.findMany({
    where: { ...whereFor(c, "public"), available: true },
    orderBy: { code: "asc" },
  });
  return rows.map(toFull);
}

export async function publicCountsByCollection(): Promise<Record<string, number>> {
  const entries = await Promise.all(
    COLLECTIONS.map(
      async (c) =>
        [c.slug, await prisma.catalogItem.count({ where: { ...whereFor(c, "public"), available: true } })] as const,
    ),
  );
  return Object.fromEntries(entries);
}
