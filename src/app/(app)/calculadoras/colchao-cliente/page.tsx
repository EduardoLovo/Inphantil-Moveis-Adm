import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ColchaoClienteClient } from "./colchao-client";

export const metadata: Metadata = { title: "Colchão do cliente" };

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/calculadoras"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Calculadoras
      </Link>
      <ColchaoClienteClient />
    </div>
  );
}
