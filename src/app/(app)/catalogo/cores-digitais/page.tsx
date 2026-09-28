import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { listCoresDigitais } from "@/lib/cores-server";
import { CoresList } from "./cores-list";

export const metadata: Metadata = { title: "Cores digitais" };
export const dynamic = "force-dynamic";

export default async function CoresDigitaisPage() {
  await guardPage([Role.DEV, Role.ADMIN]);
  const cores = await listCoresDigitais();

  return (
    <div>
      <Link
        href="/catalogo"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Catálogo
      </Link>
      <PageHeader
        title="Cores digitais"
        description="Paleta única usada nas composições de Protetor de parede, Tapete e Cama e no mostruário. Cores inativas somem de todos esses lugares."
      />
      <CoresList cores={cores} />
    </div>
  );
}
