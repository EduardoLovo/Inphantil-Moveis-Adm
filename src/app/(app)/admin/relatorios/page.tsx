import type { Metadata } from "next";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = { title: "Relatórios" };

export default async function RelatoriosPage() {
  // DEV e ADMIN (proxy + guarda de servidor + checagem na rota de download).
  await guardPage([Role.DEV, Role.ADMIN]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Relatórios"
        description="Exporte os dados do painel em planilhas do Excel (.xlsx)."
      />
      <ReportsClient />
    </div>
  );
}
