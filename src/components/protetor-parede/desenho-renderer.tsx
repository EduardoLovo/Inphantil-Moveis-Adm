"use client";

import * as React from "react";
import { desenhosData } from "./desenhos-data";

interface Props {
  /** chave do desenho em desenhosData. */
  dataKey: string;
  /** mapa corId -> hex aplicado. */
  colors: Record<string, string>;
  onClick: (e: React.MouseEvent<SVGElement>) => void;
  /** espelha horizontalmente (lado esquerdo). */
  espelhar?: boolean;
  /** cursor CSS aplicado às regiões pintáveis (ex.: pincel). */
  paintCursor?: string;
}

const COR_PADRAO = "#ccc";

/**
 * Multiplica a espessura original das linhas de todos os desenhos.
 * Fator (e não valor fixo) porque cada desenho foi exportado numa escala.
 */
const ESPESSURA_LINHA = 7;

const strokeWidthOf = (w?: string) => {
  const n = parseFloat(w ?? "");
  return Number.isFinite(n) ? n * ESPESSURA_LINHA : undefined;
};

/**
 * Amplia o viewBox para a linha mais grossa caber inteira nas bordas
 * (metade da linha fica para fora do contorno) + uma folga de 2%.
 */
function viewBoxComMargem(viewBox: string, paths: { strokeWidth?: string }[]): string {
  const [x, y, w, h] = viewBox.trim().split(/[\s,]+/).map(Number);
  if ([x, y, w, h].some((n) => !Number.isFinite(n))) return viewBox;
  const maxLinha = Math.max(0, ...paths.map((p) => strokeWidthOf(p.strokeWidth) ?? 0));
  const m = maxLinha / 2 + Math.max(w, h) * 0.02;
  return `${x - m} ${y - m} ${w + m * 2} ${h + m * 2}`;
}

/**
 * Renderizador único para todos os desenhos de protetor de parede.
 * Regiões com `colorId` são pintáveis; paths decorativos mantêm cor fixa
 * e ignoram cliques.
 */
export function DesenhoRenderer({
  dataKey,
  colors,
  onClick,
  espelhar,
  paintCursor,
}: Props) {
  const data = desenhosData[dataKey];
  if (!data) return null;

  return (
    <div
      className={`flex w-full justify-center transition-transform duration-300 ${
        espelhar ? "scale-x-[-1]" : ""
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full max-w-[820px] drop-shadow-sm"
        viewBox={viewBoxComMargem(data.viewBox, data.paths)}
        shapeRendering="geometricPrecision"
        textRendering="geometricPrecision"
        imageRendering="optimizeQuality"
        fillRule="evenodd"
        clipRule="evenodd"
      >
        {data.paths.map((p, i) => {
          const pintavel = !!p.colorId;
          const fill = pintavel
            ? colors[p.colorId as string] || COR_PADRAO
            : p.fill || "none";

          return (
            <path
              key={i}
              id={p.colorId}
              d={p.d}
              fill={fill}
              stroke={p.stroke}
              strokeWidth={strokeWidthOf(p.strokeWidth)}
              strokeMiterlimit={22.9256}
              onClick={pintavel ? onClick : undefined}
              className={pintavel ? "transition-opacity hover:opacity-80" : undefined}
              style={
                pintavel
                  ? { cursor: paintCursor ?? "pointer" }
                  : { pointerEvents: "none" }
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
