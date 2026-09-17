import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import type { MeasureType } from "@/lib/quote";
import { ProdutosClient, type ProductRow } from "./produtos-client";

export const metadata: Metadata = { title: "Produtos de orçamento" };
export const dynamic = "force-dynamic";

export default async function ProdutosOrcamentoPage() {
  await guardPage([Role.DEV, Role.ADMIN]);

  const products = await prisma.quoteProduct.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
  });

  const rows: ProductRow[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price != null ? Number(p.price) : null,
    isPriceEditable: p.isPriceEditable,
    measureType: p.measureType as MeasureType,
    dimensions: p.dimensions,
    isActive: p.isActive,
  }));

  return (
    <div>
      <Link
        href="/orcamentos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>
      <PageHeader
        title="Produtos de orçamento"
        description="Catálogo próprio usado para montar os orçamentos (separado da loja)."
      />
      <ProdutosClient products={rows} />
    </div>
  );
}
