import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { getCurrentUser, hasRole, type SessionUser } from "@/lib/rbac";

/**
 * Guarda para Server Components (páginas/layouts). Diferente de
 * `requireRole` (que lança), este redireciona — ideal para telas.
 */
export async function guardPage(allowed?: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (allowed && !hasRole(user.role, allowed)) redirect("/dashboard");
  return user;
}
