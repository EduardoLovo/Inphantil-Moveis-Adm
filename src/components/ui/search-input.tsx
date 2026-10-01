"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Campo de busca com lupa, botão de limpar e contador de resultados. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label = "Buscar",
  count,
  total,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  /** Resultados encontrados (mostrado só enquanto há busca). */
  count?: number;
  total?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <div className="relative w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onChange("")}
          placeholder={placeholder}
          className="h-11 rounded-xl pl-10 pr-9"
          aria-label={label}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Limpar busca"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      {value && count != null && total != null && (
        <span className="text-sm text-muted-foreground">
          {count} de {total}
        </span>
      )}
    </div>
  );
}
