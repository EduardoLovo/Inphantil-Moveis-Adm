import type { Metadata } from "next";
import { Role } from "@prisma/client";

import { PageHeader } from "@/components/page-header";
import { guardPage } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { UsersClient, type UserRow } from "./users-client";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsuariosPage() {
  // Somente DEV (middleware + guarda de servidor).
  const current = await guardPage([Role.DEV]);

  const users = await prisma.user.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  const rows: UserRow[] = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div>
      <PageHeader
        title="Usuários"
        description="Crie, edite e ative/desative contas. Apenas o DEV gerencia usuários."
      />
      <UsersClient users={rows} currentUserId={current.id} />
    </div>
  );
}
