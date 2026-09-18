"use client";

import {
  CAMA_PATHS,
  CAMA_REGIONS,
  CAMA_VIEWBOX,
  type CamaRegionId,
} from "./cama-data";

const COR_PADRAO = "#ccc";

type Props = {
  /** regionId -> hex aplicado. */
  colors: Partial<Record<CamaRegionId, string>>;
  onRegionClick: (regionId: CamaRegionId) => void;
  /** cursor CSS aplicado às regiões pintáveis. */
  paintCursor?: string;
};

/**
 * Renderiza o SVG da cama. Regiões pintáveis recebem cor sólida (clicáveis);
 * os contornos escuros ficam por cima, dando o acabamento.
 */
export function CamaRenderer({ colors, onRegionClick, paintCursor }: Props) {
  return (
    <div className="flex w-full justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-auto w-full max-w-[900px] drop-shadow-sm"
        viewBox={CAMA_VIEWBOX}
        shapeRendering="geometricPrecision"
        imageRendering="optimizeQuality"
        fillRule="evenodd"
        clipRule="evenodd"
      >
        {CAMA_PATHS.map((p, i) => {
          if ("regionId" in p) {
            const fill = colors[p.regionId] || COR_PADRAO;
            const region = CAMA_REGIONS.find((r) => r.id === p.regionId);
            return (
              <path
                key={i}
                d={p.d}
                fill={fill}
                onClick={() => onRegionClick(p.regionId)}
                className="transition-opacity hover:opacity-80"
                style={{ cursor: paintCursor ?? "pointer" }}
              >
                {region && <title>{region.label}</title>}
              </path>
            );
          }
          return (
            <path
              key={i}
              d={p.d}
              fill={p.fill}
              style={{ pointerEvents: "none" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
