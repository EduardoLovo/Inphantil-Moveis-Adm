import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/roles";

// Reexporta os utilitários client-safe para conveniência no servidor.
export { ROLE_RANK, ROLE_LABEL, hasRole, hasAtLeast } from "@/lib/roles";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: Role;
};

/** Retorna o usuário logado (ou null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Guarda reutilizável para Server Actions, Route Handlers e telas.
 * Lança AuthError se não autenticado ou sem papel suficiente.
 * NUNCA confie apenas no front — chame isto no servidor.
 */
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Não autenticado.", "UNAUTHENTICATED");
  }
  if (!hasRole(user.role, allowed)) {
    throw new AuthError("Acesso negado.", "FORBIDDEN");
  }
  return user;
}

/** Exige sessão válida (qualquer papel). */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Não autenticado.", "UNAUTHENTICATED");
  }
  return user;
}
