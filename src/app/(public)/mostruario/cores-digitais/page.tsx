import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Reveal } from "@/components/motion/reveal";
import { CoresGallery } from "@/components/mostruario/cores-gallery";
import { listCoresDigitaisAtivas } from "@/lib/cores-server";

export const metadata: Metadata = { title: "Cores digitais · Mostruário" };
export const dynamic = "force-dynamic";

export default async function MostruarioCoresDigitaisPage() {
  const cores = await listCoresDigitaisAtivas();

  return (
    <section className="bg-playful min-h-[calc(100vh-8rem)]">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <Reveal>
          <Link
            href="/mostruario"
            className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Mostruário
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            Cores digitais
          </h1>
          <p className="mt-2 text-muted-foreground">
            {cores.length} {cores.length === 1 ? "cor disponível" : "cores disponíveis"}
          </p>
        </Reveal>

        {cores.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
            Nenhuma cor disponível no momento.
          </div>
        ) : (
          <CoresGallery cores={cores} />
        )}
      </div>
    </section>
  );
}
