// Paleta única de cores (tabela CorDigital): usada nas composições
// (Protetores de Parede, Tapete, Cama) e no catálogo "Cores digitais".
// Client-safe: a leitura do banco fica em `cores-server.ts`.

/** Cor como as composições usam (só o necessário para pintar). */
export interface Cor {
  codigo: string;
  hex: string;
}

export type CorDigitalFull = {
  id: string;
  codigo: string;
  cor: string;
  hex: string;
  ativa: boolean;
};

/** Famílias de cor, sugeridas pelo prefixo do código (ex.: AM1 → Amarelo). */
export const FAMILIAS_POR_PREFIXO: Record<string, string> = {
  AM: "Amarelo",
  AZ: "Azul",
  B: "Bege",
  BC: "Branco",
  CZ: "Cinza",
  L: "Lilás",
  LJ: "Laranja",
  M: "Mostarda",
  R: "Rosa",
  RB: "Rosa bebê",
  T: "Tifany",
  VD: "Verde",
  VM: "Vermelho",
};

export const FAMILIAS = Object.values(FAMILIAS_POR_PREFIXO);

/** Sugere a família a partir do código ("AM14" → "Amarelo"). */
export function familiaDoCodigo(codigo: string): string | null {
  const prefixo = codigo.trim().toUpperCase().match(/^[A-Z]+/)?.[0];
  return prefixo ? (FAMILIAS_POR_PREFIXO[prefixo] ?? null) : null;
}
