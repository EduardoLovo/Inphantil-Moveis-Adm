import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser, hasRole } from "@/lib/rbac";
import { getShippingQuote } from "@/lib/shipping-server";
import { formatBRL } from "@/lib/calc";
import type { ShippingQuoteFull } from "@/lib/shipping";
import { CotacaoForm } from "./cotacao-form";
import { FreteDeleteButton } from "./frete-delete-button";

export const metadata: Metadata = { title: "Solicitação de frete" };
export const dynamic = "force-dynamic";

export default async function FreteViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) notFound();

  const user = await requireUser();
  const quote = await getShippingQuote(numId, user);
  if (!quote) notFound();

  const isStaff = hasRole(user.role, [Role.DEV, Role.ADMIN]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/frete/lista"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Solicitações
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{quote.number}</h1>
            <Badge variant={quote.isConcluded ? "success" : "muted"}>
              {quote.isConcluded ? "Concluído" : "Aberto"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            {new Date(quote.createdAt).toLocaleDateString("pt-BR")} · Solicitante: {quote.createdByName}
          </p>
        </div>
        <FreteDeleteButton id={quote.id} number={quote.number} />
      </div>

      {isStaff ? (
        <CotacaoForm quote={quote} />
      ) : (
        <ReadOnly quote={quote} />
      )}
    </div>
  );
}

function ReadOnly({ quote }: { quote: ShippingQuoteFull }) {
  const rows: Array<[string, string]> = [
    ["O que cotar", quote.quoteDetails ?? "—"],
    ["Cliente", quote.customerName ?? "—"],
    ["CPF", quote.customerCpf ?? "—"],
    ["CEP", quote.customerZipCode ?? "—"],
    ["Endereço", quote.customerAddress ?? "—"],
    ["Cidade / UF", [quote.customerCity, quote.customerState].filter(Boolean).join(" / ") || "—"],
    ["Transportadora", quote.carrierName ?? "—"],
    ["Prazo", quote.deliveryDeadline ?? "—"],
    ["Valor do frete", quote.shippingValue != null ? formatBRL(quote.shippingValue) : "—"],
    ["Volumes", quote.volumeQuantity != null ? String(quote.volumeQuantity) : "—"],
    ["Peso", quote.weight ?? "—"],
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
      <CardContent>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 text-sm">{v}</dd>
            </div>
          ))}
        </dl>
        {quote.adminNotes && (
          <p className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <span className="font-semibold">Obs.: </span>
            {quote.adminNotes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
