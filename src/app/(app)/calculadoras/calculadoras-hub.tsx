"use client";

import Link from "next/link";
import { ArrowRight, HandCoins, BedDouble, Ruler, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";

type Item = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const ITEMS: Item[] = [
  {
    href: "/calculadoras/pagamento-60-40",
    title: "Pagamento 60/40",
    description: "Simula o saldo restante após a entrada, com dedução de 6%.",
    icon: HandCoins,
  },
  {
    href: "/calculadoras/cama-sob-medida",
    title: "Cama sob medida",
    description: "Medidas externa, interna e do colchão da cama montessoriana.",
    icon: BedDouble,
  },
  {
    href: "/calculadoras/colchao-cliente",
    title: "Colchão do cliente",
    description: "Medidas da cama a partir do colchão que o cliente já tem.",
    icon: Ruler,
  },
];

export function CalculadorasHub() {
  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <StaggerItem key={item.href}>
            <Link href={item.href} className="block h-full">
              <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Abrir
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
