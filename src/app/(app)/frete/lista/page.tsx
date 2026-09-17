import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser, hasRole } from "@/lib/rbac";
import { listShippingQuotes } from "@/lib/shipping-server";
import type { ShippingStatus } from "@/lib/shipping";
import { FreteList } from "./frete-list";

export const metadata: Metadata = { title: "Solicitações de frete" };
export const dynamic = "force-dynamic";

export default async function FreteListaPage({
  searchParams,
}: {
  searchParams: Promise<{ carrier?: string; city?: string; state?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const user = await requireUser();
  const isStaff = hasRole(user.role, [Role.DEV, Role.ADMIN]);

  const status = (["abertos", "concluidos"].includes(sp.status ?? "")
    ? sp.status
    : "todos") as ShippingStatus;

  const rows = await listShippingQuotes(user, {
    carrier: sp.carrier,
    city: sp.city,
    state: sp.state,
    status,
  });

  return (
    <div>
      <Link
        href="/frete"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Frete
      </Link>
      <PageHeader
        title={isStaff ? "Solicitações de frete" : "Minhas solicitações"}
        description="Pesquise, acompanhe e cote as solicitações."
        actions={
          <Button asChild>
            <Link href="/frete/nova">
              <Plus className="size-4" /> Nova solicitação
            </Link>
          </Button>
        }
      />
      <FreteList
        rows={rows}
        isStaff={isStaff}
        initialFilters={{
          carrier: sp.carrier ?? "",
          city: sp.city ?? "",
          state: sp.state ?? "",
          status,
        }}
      />
    </div>
  );
}
