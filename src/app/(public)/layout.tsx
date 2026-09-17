import Link from "next/link";
import { LogIn } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

/** Layout público (vitrine): limpo, sem sidebar. */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
          <Link href="/" aria-label="Início">
            <Logo />
          </Link>
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mostruario">Mostruário</Link>
            </Button>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <Button size="sm" asChild>
              <Link href="/login">
                <LogIn className="size-4" />
                Entrar
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground md:px-6">
          © {new Date().getFullYear()} Inphantil · Móveis infantis
        </div>
      </footer>
    </div>
  );
}
