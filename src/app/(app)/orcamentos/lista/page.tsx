import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser, hasRole } from "@/lib/rbac";
import { listQuotes } from "@/lib/quotes-server";
import { QuotesList } from "./quotes-list";

export const metadata: Metadata = { title: "Meus orçamentos" };
export const dynamic = "force-dynamic";

export default async function ListaOrcamentosPage() {
  const user = await requireUser();
  const rows = await listQuotes(user);
  const isStaff = hasRole(user.role, [Role.DEV, Role.ADMIN]);

  return (
    <div>
      <Link
        href="/orcamentos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Orçamentos
      </Link>
      <PageHeader
        title={isStaff ? "Orçamentos" : "Meus orçamentos"}
        description={
          isStaff
            ? "Todos os orçamentos criados pela equipe."
            : "Seus orçamentos criados."
        }
        actions={
          <Button asChild>
            <Link href="/orcamentos/novo">
              <Plus className="size-4" /> Novo orçamento
            </Link>
          </Button>
        }
      />
      <QuotesList rows={rows} isStaff={isStaff} />
    </div>
  );
}
