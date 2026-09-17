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
        viewBox={data.viewBox}
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
              strokeWidth={p.strokeWidth}
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
