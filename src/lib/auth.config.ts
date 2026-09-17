import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Configuração compartilhada e "edge-safe" do Auth.js.
 * NÃO importa Prisma/bcrypt aqui — este módulo roda também no middleware
 * (edge runtime). Os providers pesados ficam em `auth.ts` (Node).
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [], // preenchido em auth.ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user.id ?? "") as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
