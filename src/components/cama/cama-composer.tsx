"use client";

import * as React from "react";
import { toBlob, toPng } from "html-to-image";
import { motion } from "framer-motion";
import { BedDouble, Eraser, Camera, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CAMA_REGIONS, type CamaRegionId } from "./cama-data";
import { CamaRenderer, proxied, type CamaFabric } from "./cama-renderer";

const ERASER = "__eraser__";

export function CamaComposer({ fabrics }: { fabrics: CamaFabric[] }) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [fills, setFills] = React.useState<Partial<Record<CamaRegionId, string>>>(
    {},
  );
  const divRef = React.useRef<HTMLDivElement>(null);

  const fabricsById = React.useMemo(
    () => new Map(fabrics.map((f) => [f.id, f])),
    [fabrics],
  );

  function pintar(regionId: CamaRegionId) {
    if (selected === null) return;
    setFills((prev) => {
      const next = { ...prev };
      if (selected === ERASER) delete next[regionId];
      else next[regionId] = selected;
      return next;
    });
  }

  function limpar() {
    setFills({});
    setSelected(null);
  }

  async function copiarPrint() {
    const el = divRef.current;
    if (!el) return;
    try {
      const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (!blob) throw new Error("blob vazio");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("Print copiado para a área de transferência!");
    } catch {
      toast.error("Não foi possível copiar. Tente baixar o PNG.");
    }
  }

  async function baixarPrint() {
    const el = divRef.current;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "cama.png";
      a.click();
    } catch {
      toast.error("Não foi possível gerar o PNG.");
    }
  }

  const paintCursor = selected ? "crosshair" : undefined;

  // Resumo dos tecidos aplicados, por região.
  const resumo = CAMA_REGIONS.map((r) => {
    const id = fills[r.id];
    const f = id ? fabricsById.get(id) : undefined;
    return f ? `${r.label}: ${f.code.toUpperCase()}` : null;
  }).filter(Boolean).join("  •  ");

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <BedDouble className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Composição de cama
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Escolha um tecido e clique nas partes da cama (colchão, borda) para
            aplicar.
          </p>
        </div>
      </div>

      {/* Paleta de tecidos */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          Escolha um tecido e clique no desenho para aplicar
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant={selected === ERASER ? "default" : "secondary"}
            size="sm"
            onClick={() => setSelected((s) => (s === ERASER ? null : ERASER))}
          >
            <Eraser className="size-4" /> Borracha
          </Button>
          <Button variant="secondary" size="sm" onClick={limpar}>
            Limpar tudo
          </Button>
        </div>
      </div>

      {fabrics.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum tecido (sintético) disponível no catálogo ainda.
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {fabrics.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelected(f.id)}
              title={`${f.code.toUpperCase()} — ${f.color}`}
              className={cn(
                "group relative overflow-hidden rounded-lg border transition-all",
                selected === f.id
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-95"
                  : "hover:scale-105",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proxied(f.imageUrl, 128)}
                alt={f.code}
                className="size-16 object-cover"
              />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 py-0.5 text-center text-[10px] font-bold text-white">
                {f.code.toUpperCase()}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Área do desenho (fundo branco, também usado no print) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <div
          ref={divRef}
          className="mb-6 flex w-full flex-col items-center justify-center rounded-2xl bg-white p-4"
        >
          <div className="w-full max-w-4xl">
            <CamaRenderer
              fills={fills}
              fabrics={fabrics}
              onRegionClick={pintar}
              paintCursor={paintCursor}
            />
          </div>

          {resumo && (
            <p className="w-full pt-4 text-center text-lg font-bold text-[#2e2f33]">
              {resumo}
            </p>
          )}
        </div>
      </motion.div>

      {/* Ações */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={copiarPrint} disabled={fabrics.length === 0}>
          <Camera className="size-4" /> Tirar print e copiar
        </Button>
        <Button variant="outline" onClick={baixarPrint} disabled={fabrics.length === 0}>
          <Download className="size-4" /> Baixar PNG
        </Button>
      </div>
    </div>
  );
}
