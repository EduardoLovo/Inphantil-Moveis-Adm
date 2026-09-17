"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Rows3, BedDouble, Scissors, PackageCheck, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { CATEGORIES, type CatalogCategoryValue } from "@/lib/catalog";

const ICONS: Record<CatalogCategoryValue, LucideIcon> = {
  APLIQUE: Sparkles,
  TAPETE: Rows3,
  CAMA: BedDouble,
  TECIDO_LENCOL: Scissors,
  PRONTA_ENTREGA: PackageCheck,
};

export function CatalogoHub({ counts }: { counts: Record<string, number> }) {
  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CATEGORIES.map((cat) => {
        const Icon = ICONS[cat.value];
        const count = counts[cat.value] ?? 0;
        return (
          <StaggerItem key={cat.value}>
            <Link href={`/catalogo/${cat.slug}`} className="block h-full">
              <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-bold">{cat.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {count} {count === 1 ? "item" : "itens"}
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
