import type { Metadata } from "next";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { requireUser, hasRole } from "@/lib/rbac";
import { OrcamentosHub } from "./orcamentos-hub";

export const metadata: Metadata = { title: "Orçamentos" };

export default async function OrcamentosPage() {
  const user = await requireUser();
  const canManageProducts = hasRole(user.role, [Role.DEV, Role.ADMIN]);

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        description="Monte orçamentos para os clientes e gerencie o catálogo de produtos."
      />
      <OrcamentosHub canManageProducts={canManageProducts} />
    </div>
  );
}
