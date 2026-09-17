/**
 * Gera um cursor CSS em forma de pincel, com as cerdas tingidas pela cor
 * atual de pintura. O "hotspot" (ponto que pinta) fica na ponta das cerdas.
 */
export function brushCursor(hex: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'>` +
    // cabo (madeira)
    `<line x1='13' y1='17' x2='27' y2='3' stroke='#8a5a2b' stroke-width='3' stroke-linecap='round'/>` +
    // virola (metal)
    `<line x1='9.5' y1='14.5' x2='16' y2='21' stroke='#b9bec4' stroke-width='4.2' stroke-linecap='round'/>` +
    // cerdas (cor atual)
    `<path d='M9.5 14.5 C4.5 17.5 2.5 22.5 3 27 C7.5 27.5 12.5 25 15.5 20.5 Z' fill='${hex}' stroke='#2e2f33' stroke-width='1.1' stroke-linejoin='round'/>` +
    `</svg>`;

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 3 27, crosshair`;
}
