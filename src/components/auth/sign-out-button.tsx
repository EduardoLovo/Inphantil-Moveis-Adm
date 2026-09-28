"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

/** Botão "Sair": encerra a sessão e volta para a tela de login. */
export function SignOutButton({
  className,
  compact = false,
}: {
  className?: string;
  /** No mobile mostra só o ícone. */
  compact?: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      onClick={() => signOut({ callbackUrl: "/login" })}
      aria-label="Sair"
    >
      <LogOut className="size-4" />
      <span className={compact ? "hidden sm:inline" : undefined}>Sair</span>
    </Button>
  );
}
