import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { requireUser, hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import type { MeasureType } from "@/lib/quote";
import { QuoteBuilder, type ProductOption } from "./quote-builder";

export const metadata: Metadata = { title: "Novo orçamento" };
export const dynamic = "force-dynamic";

export default async function NovoOrcamentoPage() {
  const user = await requireUser();

  const products = await prisma.quoteProduct.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const options: ProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price != null ? Number(p.price) : null,
    isPriceEditable: p.isPriceEditable,
    measureType: p.measureType as MeasureType,
    dimensions: p.dimensions,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/orcamentos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>
      <PageHeader
        title="Novo orçamento"
        description="Monte o orçamento e veja os valores à vista e parcelado em tempo real."
      />
      {options.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum produto de orçamento ativo.{" "}
          {hasRole(user.role, [Role.DEV, Role.ADMIN]) ? (
            <Link href="/orcamentos/produtos" className="font-semibold text-primary underline-offset-4 hover:underline">
              Cadastre produtos primeiro.
            </Link>
          ) : (
            "Peça a um administrador para cadastrar produtos."
          )}
        </div>
      ) : (
        <QuoteBuilder
          products={options}
          isManager={hasRole(user.role, [Role.DEV, Role.ADMIN])}
          sellerName={user.name ?? "—"}
        />
      )}
    </div>
  );
}
