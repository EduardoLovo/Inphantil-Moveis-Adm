"use client";

import * as React from "react";
import { ListFilter } from "lucide-react";

import { cn } from "@/lib/utils";
import { normalizeText } from "@/lib/catalog";
import type { CorDigitalFull } from "@/lib/cores-composicao";

type FacetOption = { key: string; label: string };

/** Botões de filtro pela família da cor, na ordem em que aparecem. */
function buildFacets(cores: CorDigitalFull[]): FacetOption[] {
  const map = new Map<string, FacetOption>();
  for (const c of cores) {
    const key = normalizeText(c.cor);
    if (key && !map.has(key)) {
      map.set(key, { key, label: c.cor.trim().toUpperCase() });
    }
  }
  return [...map.values()];
}

export function CoresGallery({ cores }: { cores: CorDigitalFull[] }) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const facets = React.useMemo(() => buildFacets(cores), [cores]);

  const filtered = React.useMemo(() => {
    if (!selected) return cores;
    return cores.filter((c) => normalizeText(c.cor) === selected);
  }, [cores, selected]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 w-32 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-bold uppercase tracking-wide transition-colors",
      active
        ? "border-foreground bg-foreground text-background shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted",
    );

  return (
    <div>
      {facets.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className={chip(selected === null)}
          >
            <ListFilter className="size-3.5" />
            Todos
          </button>
          {facets.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setSelected(f.key)}
              title={f.label}
              className={chip(selected === f.key)}
            >
              <span className="truncate">{f.label}</span>
            </button>
          ))}
        </div>
      )}

      <div
        key={selected ?? "__all__"}
        className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
      >
        {filtered.map((c, i) => (
          <div
            key={c.id}
            className="animate-in slide-in-from-bottom-3 overflow-hidden rounded-2xl border bg-card"
            style={{ animationDelay: `${Math.min(i, 16) * 45}ms` }}
          >
            <div
              className="aspect-square"
              style={{ backgroundColor: c.hex }}
              role="img"
              aria-label={`${c.codigo} — ${c.cor}`}
            />
            <div className="space-y-1 p-3">
              <p className="font-bold leading-tight">{c.codigo}</p>
              <p className="text-sm text-muted-foreground">{c.cor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
