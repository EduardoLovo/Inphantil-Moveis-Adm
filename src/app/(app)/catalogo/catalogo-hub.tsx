"use client";

import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Tent,
  Layers,
  Rows3,
  Scissors,
  PackageCheck,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { HUB_COLLECTIONS } from "@/lib/catalog";

const ICONS: Record<string, LucideIcon> = {
  apliques: Sparkles,
  "apliques-cabana": Tent,
  sinteticos: Layers,
  tapetes: Rows3,
  tecidos: Scissors,
  "pronta-entrega": PackageCheck,
};

export function CatalogoHub({ counts }: { counts: Record<string, number> }) {
  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {HUB_COLLECTIONS.map((col) => {
        const Icon = ICONS[col.slug] ?? Sparkles;
        const count = counts[col.slug] ?? 0;
        return (
          <StaggerItem key={col.slug}>
            <Link href={`/catalogo/${col.slug}`} className="block h-full">
              <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-bold">{col.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {count} {count === 1 ? "item" : "itens"}
                    {col.filter ? " · filtrado" : ""}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Gerenciar
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
