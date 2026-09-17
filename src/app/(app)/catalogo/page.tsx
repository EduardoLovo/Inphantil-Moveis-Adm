import type { Metadata } from "next";
import { Package } from "lucide-react";
import { Role } from "@prisma/client";

import { ComingSoon } from "@/components/coming-soon";
import { guardPage } from "@/lib/guard";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  // Catálogo é área de gestão: DEV e ADMIN.
  await guardPage([Role.DEV, Role.ADMIN]);

  return (
    <ComingSoon
      icon={<Package className="size-9" />}
      title="Catálogo"
      description="O CRUD do catálogo — que alimentará o mostruário público — nasce aqui."
    />
  );
}
