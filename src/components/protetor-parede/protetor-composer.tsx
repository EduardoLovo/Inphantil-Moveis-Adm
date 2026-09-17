"use client";

import * as React from "react";
import { toBlob, toPng } from "html-to-image";
import { motion } from "framer-motion";
import { Palette, Paintbrush, Eraser, Camera, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listaDeCores } from "@/lib/cores-composicao";
import { brushCursor } from "@/lib/brush-cursor";
import { catalogo, coresDoDesenho } from "./catalogo";
import { DesenhoRenderer } from "./desenho-renderer";

const SEM_COR = "#ccc";

// Cores indisponíveis apenas na composição de Protetores de Parede.
const CORES_EXCLUIDAS = ["l11", "cz26n", "cz25n", "az11"];
const coresProtetores = listaDeCores.filter(
  (c) => !CORES_EXCLUIDAS.includes(c.codigo),
);

export function ProtetorComposer() {
  const [modeloId, setModeloId] = React.useState(catalogo[0].id);
  const [tamanhoId, setTamanhoId] = React.useState(catalogo[0].tamanhos[0].id);
  const [ladoId, setLadoId] = React.useState(catalogo[0].tamanhos[0].lados[0].id);
  const [selectedColor, setSelectedColor] = React.useState(SEM_COR);
  const [svgColors, setSvgColors] = React.useState<Record<string, string>>({});
  const divRef = React.useRef<HTMLDivElement>(null);

  const isPaintingMode = selectedColor !== SEM_COR;

  const modelo =
    catalogo.find((m) => m.id === modeloId) ?? catalogo[0];
  const tamanho =
    modelo.tamanhos.find((t) => t.id === tamanhoId) ?? modelo.tamanhos[0];
  const lado = tamanho.lados.find((l) => l.id === ladoId) ?? tamanho.lados[0];

  const dataKey = lado.dataKey;
  const coresAtivas = coresDoDesenho(dataKey);

  function trocarModelo(id: string) {
    const m = catalogo.find((x) => x.id === id) ?? catalogo[0];
    setModeloId(m.id);
    setTamanhoId(m.tamanhos[0].id);
    setLadoId(m.tamanhos[0].lados[0].id);
  }
  function trocarTamanho(id: string) {
    const t = modelo.tamanhos.find((x) => x.id === id) ?? modelo.tamanhos[0];
    setTamanhoId(t.id);
    setLadoId(t.lados[0].id);
  }

  function handleSVGClick(e: React.MouseEvent<SVGElement>) {
    if (!isPaintingMode) return;
    const target = e.target as SVGElement;
    const id = target.id || target.parentElement?.id;
    if (id && id.startsWith("cor")) {
      setSvgColors((prev) => ({ ...prev, [id]: selectedColor }));
    }
  }

  function getColorName(colorId: string) {
    const hex = svgColors[colorId];
    if (!hex) return "";
    const cor = listaDeCores.find(
      (c) => c.hex.toLowerCase() === hex.toLowerCase(),
    );
    return cor ? cor.codigo.toUpperCase() : "";
  }

  function limparCores() {
    setSvgColors({});
    setSelectedColor(SEM_COR);
  }

  async function copiarPrint() {
    const el = divRef.current;
    if (!el) return;
    try {
      const blob = await toBlob(el, { pixelRatio: 2, backgroundColor: "#ffffff" });
      if (!blob) throw new Error("blob vazio");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
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
      a.download = `protetor-${modelo.id}-${tamanho.id}-${lado.id}.png`;
      a.click();
    } catch {
      toast.error("Não foi possível gerar o PNG.");
    }
  }

  const nomesCores = coresAtivas.map(getColorName).filter(Boolean).join(" - ");
  const paintCursor = isPaintingMode ? brushCursor(selectedColor) : undefined;

  const chip = (ativo: boolean) =>
    cn(
      "rounded-xl border px-4 py-2 text-sm font-semibold transition-all",
      ativo
        ? "border-primary bg-primary text-primary-foreground shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
    );

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Palette className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Composição de protetores de parede
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Escolha modelo, tamanho e lado; depois clique nas partes do desenho
            para pintar.
          </p>
        </div>
      </div>

      {/* Seletores */}
      <div className="grid gap-5">
        <Selector titulo="1. Modelo">
          {catalogo.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => trocarModelo(m.id)}
              className={chip(m.id === modelo.id)}
            >
              {m.label}
              {m.descricao && (
                <span
                  className={cn(
                    "block text-[10px] font-normal",
                    m.id === modelo.id ? "opacity-70" : "text-muted-foreground",
                  )}
                >
                  {m.descricao}
                </span>
              )}
            </button>
          ))}
        </Selector>

        <Selector titulo="2. Tamanho">
          {modelo.tamanhos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => trocarTamanho(t.id)}
              className={chip(t.id === tamanho.id)}
            >
              {t.label}
            </button>
          ))}
        </Selector>

        <Selector titulo="3. Lado">
          {tamanho.lados.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLadoId(l.id)}
              className={chip(l.id === lado.id)}
            >
              {l.label}
              {!l.dataKey && (
                <span
                  className={cn(
                    "block text-[10px] font-normal",
                    l.id === lado.id ? "opacity-70" : "text-muted-foreground",
                  )}
                >
                  em breve
                </span>
              )}
            </button>
          ))}
        </Selector>
      </div>

      {/* Paleta */}
      <div className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Escolha uma cor e clique no desenho para aplicar
          </p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              Pincel:
              <Paintbrush
                className="size-5"
                style={{ color: isPaintingMode ? selectedColor : "var(--muted-foreground)" }}
              />
            </span>
            <Button variant="secondary" size="sm" onClick={limparCores}>
              <Eraser className="size-4" /> Limpar cores
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {coresProtetores.map((cor) => (
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
      </div>

      {/* Área do desenho (superfície branca, também usada no print) */}
      <motion.div
        key={`${modelo.id}-${tamanho.id}-${lado.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <div
          ref={divRef}
          className="mb-6 flex w-full flex-col items-center justify-center rounded-2xl bg-white p-4"
        >
          <h2 className="mb-4 text-center text-xl font-bold text-[#2e2f33] underline decoration-primary decoration-2 underline-offset-4">
            {modelo.label}
            {tamanho.label !== "Padrão" ? ` • ${tamanho.label}` : ""} • {lado.label}
          </h2>

          <div className="w-full max-w-4xl">
            {dataKey ? (
              <DesenhoRenderer
                dataKey={dataKey}
                colors={svgColors}
                onClick={handleSVGClick}
                espelhar={lado.espelhar}
                paintCursor={paintCursor}
              />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-gray-400">
                <Palette className="mb-2 size-8 text-gray-300" />
                Desenho de <b className="mx-1">uma parede</b> deste tamanho em breve.
              </div>
            )}
          </div>

          {nomesCores && (
            <p className="w-full pt-6 text-center text-2xl font-bold text-[#2e2f33]">
              {nomesCores}
            </p>
          )}
        </div>
      </motion.div>

      {/* Ações */}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={copiarPrint} disabled={!dataKey}>
          <Camera className="size-4" /> Tirar print e copiar
        </Button>
        <Button variant="outline" onClick={baixarPrint} disabled={!dataKey}>
          <Download className="size-4" /> Baixar PNG
        </Button>
      </div>
    </div>
  );
}

function Selector({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
