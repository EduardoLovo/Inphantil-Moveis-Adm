import { Role } from "@prisma/client";

/**
 * Constantes/utilitários de papel — SEM dependências de servidor
 * (Prisma/Auth), para poderem ser usados em componentes client.
 */

export const ROLE_RANK: Record<Role, number> = {
  [Role.DEV]: 3,
  [Role.ADMIN]: 2,
  [Role.SELLER]: 1,
};

export const ROLE_LABEL: Record<Role, string> = {
  [Role.DEV]: "Desenvolvedor",
  [Role.ADMIN]: "Administrador",
  [Role.SELLER]: "Vendedor",
};

export function hasRole(role: Role, allowed: Role[]): boolean {
  return allowed.includes(role);
}

export function hasAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
