import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell/app-shell";
import { getCurrentUser } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

/** Layout da área fechada: exige sessão (o middleware já protege; aqui é
 *  a segunda barreira, no servidor). */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Portão de "trocar senha no primeiro acesso" / após reset pelo DEV.
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { mustChangePassword: true },
  });
  if (account?.mustChangePassword) redirect("/trocar-senha");

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role }}
    >
      {children}
    </AppShell>
  );
}
