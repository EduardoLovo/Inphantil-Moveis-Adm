"use client";

import * as React from "react";
import {
  CAMA_PATHS,
  CAMA_REGIONS,
  CAMA_VIEWBOX,
  type CamaRegionId,
} from "./cama-data";

export type CamaFabric = {
  id: string;
  code: string;
  color: string;
  imageUrl: string;
};

/**
 * Serve a imagem pela MESMA origem (otimizador do Next) para o preenchimento
 * funcionar tanto na tela quanto no PNG exportado, sem depender de CORS no R2.
 */
export function proxied(url: string, w = 1080) {
  return `/_next/image?url=${encodeURIComponent(url)}&w=${w}&q=75`;
}

/** Tons neutros para regiões ainda sem tecido aplicado. */
const REGION_DEFAULT: Record<CamaRegionId, string> = {
  colchao: "#f4f4f5",
  bordaExterna: "#e4e4e7",
  bordaInterna: "#ededf0",
};

type Props = {
  /** regionId -> fabricId (ou ausente = sem tecido). */
  fills: Partial<Record<CamaRegionId, string>>;
  fabrics: CamaFabric[];
  onRegionClick: (regionId: CamaRegionId) => void;
  /** cursor CSS aplicado às regiões pintáveis. */
  paintCursor?: string;
};

/**
 * Renderiza o SVG da cama. Regiões pintáveis são preenchidas com um
 * `<pattern>` que estica a foto do tecido para cobrir a peça; os contornos
 * escuros ficam por cima, dando o acabamento.
 */
export function CamaRenderer({
  fills,
  fabrics,
  onRegionClick,
  paintCursor,
}: Props) {
  const fabricsById = React.useMemo(
    () => new Map(fabrics.map((f) => [f.id, f])),
    [fabrics],
  );

  // Só criamos os patterns dos tecidos realmente usados.
  const usedFabrics = React.useMemo(() => {
    const ids = new Set(Object.values(fills).filter(Boolean) as string[]);
    return [...ids].map((id) => fabricsById.get(id)).filter(Boolean) as CamaFabric[];
  }, [fills, fabricsById]);

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
        <defs>
          {usedFabrics.map((f) => (
            <pattern
              key={f.id}
              id={`cama-pat-${f.id}`}
              patternContentUnits="objectBoundingBox"
              width="1"
              height="1"
            >
              <image
                href={proxied(f.imageUrl, 1080)}
                width="1"
                height="1"
                preserveAspectRatio="xMidYMid slice"
              />
            </pattern>
          ))}
        </defs>

        {CAMA_PATHS.map((p, i) => {
          if ("regionId" in p) {
            const fabricId = fills[p.regionId];
            const fill = fabricId
              ? `url(#cama-pat-${fabricId})`
              : REGION_DEFAULT[p.regionId];
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
