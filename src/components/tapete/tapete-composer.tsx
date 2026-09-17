"use client";

import * as React from "react";
import { toBlob, toPng } from "html-to-image";
import { motion } from "framer-motion";
import { Palette, Paintbrush, Eraser, Camera, Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { listaDeCores } from "@/lib/cores-composicao";
import { brushCursor } from "@/lib/brush-cursor";

// Módulo do quadradinho (cm). A última coluna/linha recebe o resto.
const MODULO = 13;
const SEM_COR = "";
const COR_VAZIA = "#f4f4f4";

type Modo = "diagonal" | "quadradinho";

/** Divide um total em quadradinhos: cheios de MODULO + o resto no fim. */
function tamanhos(total: number): number[] {
  const cols = Math.ceil(total / MODULO);
  const out: number[] = [];
  for (let i = 0; i < cols; i++) {
    out.push(i < cols - 1 ? MODULO : total - (cols - 1) * MODULO);
  }
  return out;
}

export function TapeteComposer() {
  const [comprimento, setComprimento] = React.useState("87");
  const [largura, setLargura] = React.useState("50");
  const [selectedColor, setSelectedColor] = React.useState(SEM_COR);
  const [modo, setModo] = React.useState<Modo>("diagonal");
  const [cellColors, setCellColors] = React.useState<Record<string, string>>({});
  const [hover, setHover] = React.useState<{ d: number; key: string } | null>(null);
  const divRef = React.useRef<HTMLDivElement>(null);

  const C = parseInt(comprimento, 10) || 0;
  const L = parseInt(largura, 10) || 0;
  const valido = C > 0 && L > 0;

  const colSizes = valido ? tamanhos(C) : [];
  const rowSizes = valido ? tamanhos(L) : [];
  const cols = colSizes.length;
  const rows = rowSizes.length;

  // escala px/cm para caber na área
  const escala = valido ? Math.min(14, 760 / C) : 0;

  const contagem: Record<string, number> = {};
  Object.values(cellColors).forEach((h) => {
    contagem[h] = (contagem[h] || 0) + 1;
  });
  const coresUsadas = listaDeCores.filter((c) => contagem[c.hex] > 0);

  const isPaintingMode = selectedColor !== SEM_COR;
  const paintCursor = isPaintingMode ? brushCursor(selectedColor) : undefined;

  function alterarMedida(setter: (v: string) => void, valor: string) {
    setter(valor);
    setCellColors({}); // muda a grade -> zera a pintura
  }

  function pintar(r: number, c: number) {
    if (!isPaintingMode) return;
    setCellColors((prev) => {
      const next = { ...prev };
      if (modo === "diagonal") {
        const d = c - r;
        for (let rr = 0; rr < rows; rr++) {
          for (let cc = 0; cc < cols; cc++) {
            if (cc - rr === d) next[`${rr},${cc}`] = selectedColor;
          }
        }
      } else {
        next[`${r},${c}`] = selectedColor;
      }
      return next;
    });
  }

  function destacado(r: number, c: number) {
    if (!hover) return false;
    return modo === "diagonal" ? c - r === hover.d : hover.key === `${r},${c}`;
  }

  function limpar() {
    setCellColors({});
    setSelectedColor(SEM_COR);
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
      a.download = `tapete-${C}x${L}.png`;
      a.click();
    } catch {
      toast.error("Não foi possível gerar o PNG.");
    }
  }

  const corAtualNome =
    listaDeCores.find((c) => c.hex === selectedColor)?.codigo.toUpperCase() ??
    "nenhuma";

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl border bg-card px-5 py-4 shadow-sm">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Palette className="size-5" />
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight">
            Composição de tapete
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Informe as medidas, escolha uma cor e clique para pintar as diagonais
            (ou quadradinhos).
          </p>
        </div>
      </div>

      {/* Medidas */}
      <div className="flex flex-wrap items-end gap-5">
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">
            Comprimento (cm)
          </Label>
          <Input
            type="number"
            min={1}
            value={comprimento}
            onChange={(e) => alterarMedida(setComprimento, e.target.value)}
            className="w-32 text-center text-base font-bold"
          />
        </div>
        <div>
          <Label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">
            Largura (cm)
          </Label>
          <Input
            type="number"
            min={1}
            value={largura}
            onChange={(e) => alterarMedida(setLargura, e.target.value)}
            className="w-32 text-center text-base font-bold"
          />
        </div>
        <span className="pb-2.5 text-sm text-muted-foreground">
          Módulo {MODULO} × {MODULO} cm
        </span>
        {valido && (
          <span className="pb-2.5 text-sm text-muted-foreground md:ml-auto">
            {cols} colunas × {rows} linhas = {cols * rows} quadradinhos
          </span>
        )}
      </div>

      {/* Modo + limpar */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold">Pintura:</span>
        {(["diagonal", "quadradinho"] as Modo[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModo(m)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-semibold transition-all",
              modo === m
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted",
            )}
          >
            {m === "diagonal" ? "Diagonal" : "Quadradinho"}
          </button>
        ))}
        <Button variant="secondary" size="sm" className="ml-auto" onClick={limpar}>
          <Eraser className="size-4" /> Limpar
        </Button>
      </div>

      {/* Paleta */}
      <div className="mt-5 flex flex-wrap justify-center gap-1.5 md:justify-start">
        {listaDeCores.map((cor) => (
          <button
            key={cor.codigo}
            type="button"
            onClick={() => setSelectedColor(cor.hex)}
            title={cor.codigo}
            className={cn(
              "w-[52px] rounded-lg py-2 text-xs font-bold text-[#0c0c0c] transition-all md:w-[62px]",
              selectedColor === cor.hex
                ? "scale-95 shadow-md ring-2 ring-foreground/70 ring-offset-1 ring-offset-background"
                : "shadow-sm hover:scale-105",
            )}
            style={{ backgroundColor: cor.hex }}
          >
            {cor.codigo.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Cor atual (com pincel tingido) */}
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        Pincel:
        <Paintbrush
          className="size-5"
          style={{ color: isPaintingMode ? selectedColor : "var(--muted-foreground)" }}
        />
        <span className="font-semibold text-foreground">{corAtualNome}</span>
      </div>

      {/* Área do tapete (superfície branca, usada também no print) */}
      <motion.div
        key={`${C}x${L}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8"
      >
        <div
          ref={divRef}
          className="inline-block w-full overflow-x-auto rounded-2xl bg-white p-4 md:w-auto"
        >
          {valido ? (
            <div className="flex flex-col gap-8 md:flex-row md:items-start">
              <div className="inline-block">
                <div className="mb-1.5 text-center text-sm text-gray-600">
                  {C} cm
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="relative self-stretch text-sm text-gray-600"
                    style={{ width: 22 }}
                  >
                    <span
                      className="absolute whitespace-nowrap"
                      style={{
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) rotate(-90deg)",
                      }}
                    >
                      {L} cm
                    </span>
                  </div>
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: colSizes
                        .map((w) => `${w * escala}px`)
                        .join(" "),
                      gridTemplateRows: rowSizes
                        .map((h) => `${h * escala}px`)
                        .join(" "),
                      boxShadow: "inset 0 0 0 1px rgba(90,90,90,0.5)",
                    }}
                    onMouseLeave={() => setHover(null)}
                  >
                    {rowSizes.map((_, r) =>
                      colSizes.map((__, c) => {
                        const key = `${r},${c}`;
                        return (
                          <div
                            key={key}
                            onClick={() => pintar(r, c)}
                            onMouseEnter={() => setHover({ d: c - r, key })}
                            style={{
                              backgroundColor: cellColors[key] || COR_VAZIA,
                              boxShadow: "inset 0 0 0 0.5px rgba(90,90,90,0.5)",
                              filter: destacado(r, c) ? "brightness(0.82)" : "none",
                              cursor: paintCursor ?? "pointer",
                            }}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>

              {coresUsadas.length > 0 && (
                <div className="min-w-[160px] text-left md:pt-6">
                  <p className="mb-2 text-sm font-bold text-gray-700">
                    Cores do tapete
                  </p>
                  <ul className="space-y-1.5">
                    {coresUsadas.map((cor) => (
                      <li key={cor.codigo} className="flex items-center gap-2 text-sm">
                        <span
                          className="inline-block size-5 rounded border border-gray-300"
                          style={{ backgroundColor: cor.hex }}
                        />
                        <span className="font-semibold text-gray-800">
                          {cor.codigo.toUpperCase()}
                        </span>
                        <span className="ml-auto text-xs text-gray-400">
                          {contagem[cor.hex]}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center px-8 text-gray-400">
              Informe o comprimento e a largura para montar o tapete.
            </div>
          )}
        </div>
      </motion.div>

      {/* Ações */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={copiarPrint} disabled={!valido}>
          <Camera className="size-4" /> Tirar print e copiar
        </Button>
        <Button variant="outline" onClick={baixarPrint} disabled={!valido}>
          <Download className="size-4" /> Baixar PNG
        </Button>
      </div>
    </div>
  );
}
