import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/** Rotas abertas (sem login): landing, vitrine pública e a tela de login. */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login") return true;
  if (pathname === "/mostruario" || pathname.startsWith("/mostruario/")) {
    return true;
  }
  return false;
}

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Já logado tentando a tela de login → manda pro app.
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  // Rota fechada sem sessão → login (preservando o destino).
  if (!isLoggedIn) {
    const url = new URL("/login", nextUrl);
    url.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Defesa em profundidade: /admin/usuarios é só para DEV.
  if (pathname.startsWith("/admin/usuarios") && role !== "DEV") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Ignora API (cada handler cuida da própria auth) e assets estáticos.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
