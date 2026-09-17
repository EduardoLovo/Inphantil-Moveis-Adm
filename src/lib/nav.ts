import {
  LayoutDashboard,
  Calculator,
  ShieldHalf,
  Rows3,
  FileText,
  Truck,
  Package,
  ImageUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Role } from "@prisma/client";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
  soon?: boolean;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

const ALL: Role[] = [Role.DEV, Role.ADMIN, Role.SELLER];
const STAFF: Role[] = [Role.DEV, Role.ADMIN];
const DEV_ONLY: Role[] = [Role.DEV];

/** Estrutura do menu da área fechada. `soon` marca placeholders. */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Geral",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
    ],
  },
  {
    title: "Ferramentas",
    items: [
      { label: "Calculadoras", href: "/calculadoras", icon: Calculator, roles: ALL, soon: true },
      { label: "Protetor de parede", href: "/protetor-parede", icon: ShieldHalf, roles: ALL, soon: true },
      { label: "Tapete", href: "/tapete", icon: Rows3, roles: ALL, soon: true },
      { label: "Orçamentos", href: "/orcamentos", icon: FileText, roles: ALL, soon: true },
      { label: "Frete", href: "/frete", icon: Truck, roles: ALL, soon: true },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { label: "Catálogo", href: "/catalogo", icon: Package, roles: STAFF, soon: true },
    ],
  },
  {
    title: "Administração",
    items: [
      { label: "Teste de upload", href: "/admin/upload-teste", icon: ImageUp, roles: STAFF },
      { label: "Usuários", href: "/admin/usuarios", icon: Users, roles: DEV_ONLY },
    ],
  },
];

/** Retorna apenas os grupos/itens visíveis para o papel informado. */
export function navForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(role)),
  })).filter((group) => group.items.length > 0);
}

/** `true` se o papel pode acessar o caminho (checagem server-side). */
export function canAccessPath(role: Role, pathname: string): boolean {
  const item = NAV_GROUPS.flatMap((g) => g.items).find((i) =>
    pathname === i.href || pathname.startsWith(`${i.href}/`),
  );
  if (!item) return true; // rotas sem item de menu (ex.: dashboard base)
  return item.roles.includes(role);
}
