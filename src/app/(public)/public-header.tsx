"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/**
 * Header da área pública. No mostruário (páginas que os clientes veem) o
 * botão "Entrar" some e o logo deixa de ser clicável, para não induzirem a
 * tentar acessar a área interna.
 */
export function PublicHeader() {
  const pathname = usePathname();
  const isShowcase = pathname.startsWith("/mostruario");

  return (
    <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
        {isShowcase ? (
          <Logo />
        ) : (
          <Link href="/" aria-label="Início">
            <Logo />
          </Link>
        )}
        <nav className="ml-4 hidden items-center gap-1 sm:flex">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/mostruario">Mostruário</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {!isShowcase && (
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="size-4" />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
