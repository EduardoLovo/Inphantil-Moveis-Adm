"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, PackageSearch, Calculator } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaggerContainer, StaggerItem } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export function FreteHub() {
  return (
    <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StaggerItem>
        <HubCard
          icon={FilePlus2}
          title="Nova solicitação"
          description="Solicite a cotação de um frete para um cliente."
          href="/frete/nova"
        />
      </StaggerItem>
      <StaggerItem>
        <HubCard
          icon={PackageSearch}
          title="Solicitações"
          description="Acompanhe, pesquise, cote e exporte as solicitações."
          href="/frete/lista"
        />
      </StaggerItem>
      <StaggerItem>
        <HubCard
          icon={Calculator}
          title="Calculadora Correios"
          description="Calcula preço e prazo pelos Correios."
          href="/frete/calculadora"
        />
      </StaggerItem>
    </StaggerContainer>
  );
}

function HubCard({
  icon: Icon,
  title,
  description,
  href,
  soon,
}: {
  icon: typeof FilePlus2;
  title: string;
  description: string;
  href?: string;
  soon?: boolean;
}) {
  const inner = (
    <Card
      className={cn(
        "h-full transition-all",
        href ? "group hover:-translate-y-1 hover:border-primary/40 hover:shadow-md" : "opacity-70",
      )}
    >
      <CardContent className="flex h-full flex-col p-5">
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex items-center gap-2">
          <h3 className="font-bold">{title}</h3>
          {soon && <Badge variant="muted">em breve</Badge>}
        </div>
        <p className="mt-1 flex-1 text-sm text-muted-foreground">{description}</p>
        {href && (
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Abrir <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </CardContent>
    </Card>
  );
  return href ? <Link href={href} className="block h-full">{inner}</Link> : inner;
}
