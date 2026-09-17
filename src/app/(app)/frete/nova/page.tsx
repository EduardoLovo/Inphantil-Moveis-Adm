import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/rbac";
import { NovaFreteForm } from "./nova-form";

export const metadata: Metadata = { title: "Nova solicitação de frete" };

export default async function NovaFretePage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/frete"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Frete
      </Link>
      <PageHeader
        title="Nova solicitação de frete"
        description="Preencha os dados do cliente; a cotação (transportadora, valor, prazo) é feita depois."
      />
      <NovaFreteForm />
    </div>
  );
}
