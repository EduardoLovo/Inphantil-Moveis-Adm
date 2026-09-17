import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CamaSobMedidaClient } from "./cama-client";

export const metadata: Metadata = { title: "Cama sob medida" };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/calculadoras"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Calculadoras
      </Link>
      <CamaSobMedidaClient />
    </div>
  );
}
