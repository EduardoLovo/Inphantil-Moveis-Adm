"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Role } from "@prisma/client";

import { navForRole } from "@/lib/nav";
import { ROLE_LABEL } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Reveal,
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/reveal";

export function DashboardContent({
  name,
  role,
}: {
  name?: string | null;
  role: Role;
}) {
  // Itens de acesso rápido: tudo que o papel vê, menos o próprio dashboard.
  const items = navForRole(role)
    .flatMap((g) => g.items)
    .filter((i) => i.href !== "/dashboard");

  const firstName = name?.split(" ")[0] ?? "equipe";

  return (
    <div>
      <Reveal>
        <div className="mb-8">
          <Badge variant="secondary" className="mb-3">
            {ROLE_LABEL[role]}
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Olá, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted-foreground">
            Escolha uma ferramenta para começar.
          </p>
        </div>
      </Reveal>

      <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <StaggerItem key={item.href}>
              <Link href={item.href} className="block h-full">
                <Card className="group h-full transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex items-start gap-4 p-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{item.label}</h3>
                        {item.soon && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            em breve
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        Acessar {item.label.toLowerCase()}
                      </p>
                    </div>
                    <ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
