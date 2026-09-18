"use client";

import * as React from "react";
import { ImageOff, ListFilter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LightboxImage } from "@/components/mostruario/lightbox-image";
import { cn } from "@/lib/utils";
import {
  PRONTA_KIND_LABEL,
  PRONTA_TAMANHO_LABEL,
  PRONTA_TAMANHOS,
  normalizeText,
  type CatalogItemFull,
  type CategoryMeta,
  type FacetField,
} from "@/lib/catalog";

type FacetOption = { key: string; label: string; order: number };

/** Chave normalizada do item para a faceta escolhida (ou null se não tiver). */
function facetKeyOf(item: CatalogItemFull, facet: FacetField): string | null {
  if (facet === "tamanho") return item.tamanho ?? null;
  const c = item.color?.trim();
  return c ? normalizeText(c) : null;
}

/** Monta as opções de filtro presentes nos itens, sem duplicar equivalentes. */
function buildFacets(
  items: CatalogItemFull[],
  facet: FacetField,
): FacetOption[] {
  const map = new Map<string, FacetOption>();
  for (const item of items) {
    const key = facetKeyOf(item, facet);
    if (!key || map.has(key)) continue;
    if (facet === "tamanho") {
      const t = item.tamanho!;
      map.set(key, {
        key,
        label: PRONTA_TAMANHO_LABEL[t].toUpperCase(),
        order: PRONTA_TAMANHOS.indexOf(t),
      });
    } else {
      map.set(key, {
        key,
        label: item.color.trim().toUpperCase(),
        order: 0,
      });
    }
  }
  const opts = [...map.values()];
  if (facet === "tamanho") opts.sort((a, b) => a.order - b.order);
  else opts.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  return opts;
}

export function MostruarioGallery({
  items,
  meta,
  facet,
}: {
  items: CatalogItemFull[];
  meta: CategoryMeta;
  facet: FacetField;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);

  const facets = React.useMemo(() => buildFacets(items, facet), [items, facet]);

  const filtered = React.useMemo(() => {
    if (!selected) return items;
    return items.filter((i) => facetKeyOf(i, facet) === selected);
  }, [items, facet, selected]);

  const chip = (active: boolean) =>
    cn(
      "inline-flex h-9 w-32 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-bold uppercase tracking-wide transition-colors",
      active
        ? "border-foreground bg-foreground text-background shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted",
    );

  return (
    <div>
      {/* Botões de filtro */}
      {facets.length > 0 && (
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

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          Nenhum item nesta seleção.
        </div>
      ) : (
        <div
          key={selected ?? "__all__"}
          className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="animate-in slide-in-from-bottom-3 overflow-hidden rounded-2xl border bg-card"
              style={{ animationDelay: `${Math.min(i, 16) * 45}ms` }}
            >
              <div className="relative aspect-square bg-muted">
                {item.imageUrl ? (
                  <LightboxImage
                    src={item.imageUrl}
                    alt={`${item.code} — ${item.color}`}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-muted-foreground">
                    <ImageOff className="size-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-3">
                <p className="font-bold leading-tight">{item.code}</p>
                <p className="text-sm text-muted-foreground">{item.color}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {meta.hasFazExterno && (
                    <Badge variant="secondary">
                      {item.fazExterno ? "Interno + Externo" : "Interno"}
                    </Badge>
                  )}
                  {meta.hasProntaKind && item.prontaKind && (
                    <Badge variant="secondary">
                      {PRONTA_KIND_LABEL[item.prontaKind]}
                    </Badge>
                  )}
                  {meta.hasTamanho && item.tamanho && (
                    <Badge variant="default">
                      {PRONTA_TAMANHO_LABEL[item.tamanho]}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
