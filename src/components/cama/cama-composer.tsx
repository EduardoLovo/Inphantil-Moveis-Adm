"use client";

import * as React from "react";
import { toBlob, toPng } from "html-to-image";
import { motion } from "framer-motion";
import { BedDouble, Paintbrush, Eraser, Camera, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listaDeCores } from "@/lib/cores-composicao";
import { brushCursor } from "@/lib/brush-cursor";
import { CAMA_REGIONS, type CamaRegionId } from "./cama-data";
import { CamaRenderer } from "./cama-renderer";

const SEM_COR = "#ccc";

export function CamaComposer() {
  const [selectedColor, setSelectedColor] = React.useState(SEM_COR);
  const [colors, setColors] = React.useState<
    Partial<Record<CamaRegionId, string>>
  >({});
  const divRef = React.useRef<HTMLDivElement>(null);

  const isPaintingMode = selectedColor !== SEM_COR;

  function pintar(regionId: CamaRegionId) {
    if (!isPaintingMode) return;
    setColors((prev) => ({ ...prev, [regionId]: selectedColor }));
  }

  function limparCores() {
    setColors({});
    setSelectedColor(SEM_COR);
  }

  function nomeCor(hex?: string) {
    if (!hex) return "";
    const cor = listaDeCores.find(
      (c) => c.hex.toLowerCase() === hex.toLowerCase(),
    );
    return cor ? cor.codigo.toUpperCase() : "";
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

  const paintCursor = isPaintingMode ? brushCursor(selectedColor) : undefined;

  // Resumo das cores aplicadas, por região.
  const resumo = CAMA_REGIONS.map((r) => {
    const nome = nomeCor(colors[r.id]);
    return nome ? `${r.label}: ${nome}` : null;
  })
    .filter(Boolean)
    .join("  •  ");

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
            Escolha uma cor e clique nas partes da cama (colchão, borda) para
            pintar.
          </p>
        </div>
      </div>

      {/* Paleta */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          Escolha uma cor e clique no desenho para aplicar
        </p>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            Pincel:
            <Paintbrush
              className="size-5"
              style={{
                color: isPaintingMode ? selectedColor : "var(--muted-foreground)",
              }}
            />
          </span>
          <Button variant="secondary" size="sm" onClick={limparCores}>
            <Eraser className="size-4" /> Limpar cores
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5">
        {listaDeCores.map((cor) => (
          <button
            key={cor.codigo}
            type="button"
            onClick={() => setSelectedColor(cor.hex)}
            title={cor.codigo}
            className={cn(
              "w-[58px] rounded-lg py-2.5 text-xs font-bold text-[#0c0c0c] transition-all md:w-[68px]",
              selectedColor === cor.hex
                ? "shadow-md ring-2 ring-foreground/70 ring-offset-1 ring-offset-background scale-95"
                : "shadow-sm hover:scale-105",
            )}
            style={{ backgroundColor: cor.hex }}
          >
            {cor.codigo.toUpperCase()}
          </button>
        ))}
      </div>

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
              colors={colors}
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
        <Button onClick={copiarPrint}>
          <Camera className="size-4" /> Tirar print e copiar
        </Button>
        <Button variant="outline" onClick={baixarPrint}>
          <Download className="size-4" /> Baixar PNG
        </Button>
      </div>
    </div>
  );
}
