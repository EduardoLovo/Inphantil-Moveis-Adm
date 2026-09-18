import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Tent,
  Layers,
  Rows3,
  Scissors,
  PackageCheck,
  Store,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { ConstellationField } from "@/components/motion/constellation-field";
import { COLLECTIONS } from "@/lib/catalog";
import { publicCountsByCollection } from "@/lib/catalog-server";

export const metadata: Metadata = { title: "Mostruário" };
export const dynamic = "force-dynamic";

const ICONS: Record<string, LucideIcon> = {
  apliques: Sparkles,
  "apliques-cabana": Tent,
  sinteticos: Layers,
  tapetes: Rows3,
  tecidos: Scissors,
  "pronta-entrega": PackageCheck,
};

export default async function MostruarioPage() {
  const counts = await publicCountsByCollection();
  const collections = COLLECTIONS.filter((c) => (counts[c.slug] ?? 0) > 0);

  return (
    <section className="relative flex-1 overflow-hidden bg-playful">
      <ConstellationField />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Nosso <span className="text-gradient">mostruário</span>
          </h1>
          <p className="mt-3 text-balance text-muted-foreground">
            Explore nossas cores e modelos. Escolha uma coleção para ver as opções
            disponíveis.
          </p>
        </Reveal>

        {collections.length === 0 ? (
          <Reveal className="mx-auto max-w-md text-center">
            <div className="grid place-items-center gap-3 rounded-2xl border border-dashed p-12 text-muted-foreground">
              <Store className="size-8" />
              <p>Em breve nossas coleções aparecem aqui.</p>
            </div>
          </Reveal>
        ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((col) => {
              const Icon = ICONS[col.slug] ?? Sparkles;
              const count = counts[col.slug] ?? 0;
              return (
                <StaggerItem key={col.slug}>
                  <Link href={`/mostruario/${col.slug}`} className="block h-full">
                    <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                      <CardContent className="flex h-full flex-col p-6">
                        <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                          <Icon className="size-6" />
                        </span>
                        <h2 className="text-lg font-bold">{col.label}</h2>
                        <p className="mt-1 flex-1 text-sm text-muted-foreground">
                          {count} {count === 1 ? "opção" : "opções"}
                        </p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                          Ver coleção
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}
