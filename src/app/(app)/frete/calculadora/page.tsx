import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/rbac";
import { CorreiosCalculator } from "./calc-client";

export const metadata: Metadata = { title: "Calculadora Correios" };

export default async function CalculadoraCorreiosPage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/frete"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Frete
      </Link>
      <PageHeader
        title="Calculadora Correios"
        description="Preço e prazo (PAC e SEDEX) a partir do CEP e das dimensões."
      />
      <CorreiosCalculator />
    </div>
  );
}
