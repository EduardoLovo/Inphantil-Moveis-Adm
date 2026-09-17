import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/rbac";
import { getQuoteFull } from "@/lib/quotes-server";
import { MEASURE_LABEL, type QuoteItemFull } from "@/lib/quote";
import { formatBRL } from "@/lib/calc";
import { quotePreview } from "@/lib/quote-pricing";
import { QuoteActions } from "./quote-actions";

export const metadata: Metadata = { title: "Orçamento" };
export const dynamic = "force-dynamic";

function qtyLabel(it: QuoteItemFull) {
  if (it.measureType === "UNIDADE") return `${it.quantity ?? 0} un`;
  const unit = it.measureType === "METRO_QUADRADO" ? "m²" : "m";
  return `${(it.measure ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${unit}`;
}

export default async function OrcamentoViewPage({
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

  const preview = quotePreview({
    subtotal: quote.subtotal,
    shippingValue: quote.shippingValue,
    discountPercent: quote.discountPercent,
    discountFixed: quote.discountFixed,
    oneInstallmentDiscount: quote.oneInstallmentDiscount,
    maxInstallments: quote.installments ?? 10,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/orcamentos/lista"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {quote.number}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {quote.customerName} · {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
            {" · "}Vendedor(a): {quote.sellerName}
          </p>
        </div>
        <QuoteActions quote={quote} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Itens */}
        <Card>
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Qtd / Medida</TableHead>
                  <TableHead className="text-right">Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quote.items.map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <span className="font-medium">{it.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {it.sku ? `${it.sku} · ` : ""}
                        {MEASURE_LABEL[it.measureType]}
                        {it.dimensions ? ` · ${it.dimensions}` : ""}
                      </span>
                      {it.note && (
                        <span className="block text-xs italic text-muted-foreground">
                          Obs.: {it.note}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{qtyLabel(it)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(it.unitPrice)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(it.lineTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold tabular-nums">{formatBRL(preview.subtotal)}</span>
              </div>
              {preview.discountValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desconto à vista</span>
                  <span className="font-semibold tabular-nums">− {formatBRL(preview.discountValue)}</span>
                </div>
              )}
              {preview.shippingValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Frete{quote.shippingZipCode ? ` (${quote.shippingZipCode})` : ""}
                  </span>
                  <span className="font-semibold tabular-nums">+ {formatBRL(preview.shippingValue)}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <p className="text-xs font-bold uppercase tracking-wider">À vista</p>
              <p className="text-2xl font-black tabular-nums">{formatBRL(preview.totalVista)}</p>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-bold">No crédito</p>
              <ul className="space-y-1 text-sm">
                {preview.installments.map((line) => (
                  <li key={line.n} className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-muted-foreground">
                      {line.n}x{" "}
                      {line.n === 1
                        ? line.desconto1x && (
                            <Badge variant="success" className="ml-1">−4%</Badge>
                          )
                        : (
                            <span className={line.comJuros ? "text-amber-600" : "text-[color:var(--success)]"}>
                              {line.comJuros ? "c/ juros" : "s/ juros"}
                            </span>
                          )}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {formatBRL(line.parcela)}
                      {line.comJuros && (
                        <span className="font-normal text-muted-foreground"> (tot. {formatBRL(line.total)})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
