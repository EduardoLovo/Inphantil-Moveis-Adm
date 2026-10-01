import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, History, Pencil, UserRound } from "lucide-react";
import { Role } from "@prisma/client";

import { requireUser, hasRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { getQuoteFull } from "@/lib/quotes-server";
import type { MeasureType } from "@/lib/quote";
import { QuoteBuilder, type ProductOption } from "../novo/quote-builder";
import { QuoteActions } from "./quote-actions";

export const metadata: Metadata = { title: "Editar orçamento" };
export const dynamic = "force-dynamic";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function OrcamentoEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();

  const user = await requireUser();
  const quote = await getQuoteFull(numId, user);
  if (!quote) notFound();

  const usedIds = quote.items.flatMap((i) => i.quoteProductId ?? []);
  const [products, editable] = await Promise.all([
    prisma.quoteProduct.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    // Inclui inativos: o item salvo continua com valor editável se o produto era assim.
    prisma.quoteProduct.findMany({
      where: { id: { in: usedIds }, isPriceEditable: true },
      select: { id: true },
    }),
  ]);

  const options: ProductOption[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price != null ? Number(p.price) : null,
    isPriceEditable: p.isPriceEditable,
    measureType: p.measureType as MeasureType,
    dimensions: p.dimensions,
  }));

  const isManager = hasRole(user.role, [Role.DEV, Role.ADMIN]);
  const wasUpdated =
    new Date(quote.updatedAt).getTime() - new Date(quote.createdAt).getTime() > 60_000;

  return (
    <div className="mx-auto max-w-6xl pb-24">
      <Link
        href="/orcamentos/lista"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Pencil className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight">{quote.number}</h1>
              <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-accent-foreground">
                Editando
              </span>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> Criado em {fmtDate(quote.createdAt)}
              </span>
              {wasUpdated && (
                <span className="inline-flex items-center gap-1.5">
                  <History className="size-3.5" /> Atualizado em {fmtDate(quote.updatedAt)}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" /> {quote.sellerName}
              </span>
            </div>
          </div>
        </div>
        {isManager && <QuoteActions quote={quote} />}
      </div>

      <QuoteBuilder
        products={options}
        isManager={isManager}
        sellerName={quote.sellerName}
        quote={quote}
        editableProductIds={editable.map((p) => p.id)}
      />
    </div>
  );
}
