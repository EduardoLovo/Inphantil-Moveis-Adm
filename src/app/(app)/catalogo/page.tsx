import type { Metadata } from "next";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { countsByCollection } from "@/lib/catalog-server";
import { CatalogoHub } from "./catalogo-hub";

export const metadata: Metadata = { title: "Catálogo" };
export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  await guardPage([Role.DEV, Role.ADMIN]);
  const counts = await countsByCollection();

  return (
    <div>
      <PageHeader
        title="Catálogo"
        description="Gerencie os itens que alimentam o mostruário público."
      />
      <CatalogoHub counts={counts} />
    </div>
  );
}
