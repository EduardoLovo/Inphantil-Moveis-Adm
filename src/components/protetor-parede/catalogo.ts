import { desenhosData } from "./desenhos-data";

export type LadoId = "direito" | "esquerdo" | "uma-parede";

export interface LadoOption {
  id: LadoId;
  label: string;
  dataKey?: string;
  espelhar?: boolean;
}

export interface TamanhoOption {
  id: string;
  label: string;
  lados: LadoOption[];
}

export interface ModeloOption {
  id: string;
  label: string;
  descricao?: string;
  tamanhos: TamanhoOption[];
}

// Modelos (prefixo da chave em desenhosData; `uma` = desenho de uma parede).
const MODELOS = [
  { id: "nuvem", label: "Nuvem", prefixo: "nuvem", uma: "nuvemUma" },
  { id: "onda", label: "Onda", prefixo: "onda", uma: "ondaUma" },
  { id: "pico", label: "Pico", prefixo: "pico", uma: "picoUma" },
  { id: "montanha", label: "Montanha", prefixo: "montanha", uma: "montanhaUma" },
  { id: "cercaAleatoria", label: "Cerca Aleatória", prefixo: "cercaAleatoria", uma: "cercaAleatoriaUma" },
  { id: "cercaEncaixe", label: "Cerca Encaixe", prefixo: "cercaEncaixe", uma: "cercaEncaixeUma" },
  { id: "cercaRedonda", label: "Cerca Redonda", prefixo: "cercaRedonda", uma: "cercaRedondaUma" },
] as const;

// Tamanhos, em ordem de exibição (sufixo da chave em desenhosData).
const TAMANHOS = [
  { id: "berco", label: "Berço", suf: "Berco" },
  { id: "junior", label: "Junior", suf: "Junior" },
  { id: "solteiro", label: "Solteiro", suf: "Solteiro" },
  { id: "solteirao", label: "Solteirão", suf: "Solteirao" },
  { id: "viuva", label: "Viúva", suf: "Viuva" },
  { id: "casal", label: "Casal", suf: "Casal" },
  { id: "queen", label: "Queen", suf: "Queen" },
  { id: "king", label: "King", suf: "King" },
];

// Monta o catálogo a partir dos SVGs disponíveis (direito + esquerdo espelhado).
export const catalogo: ModeloOption[] = MODELOS.map((m) => {
  const tamanhos: TamanhoOption[] = TAMANHOS.filter(
    (t) => desenhosData[m.prefixo + t.suf],
  ).map((t) => {
    const dataKey = m.prefixo + t.suf;
    const umaKey = "uma" in m ? m.uma : undefined;
    const lados: LadoOption[] = [
      { id: "direito", label: "Lado Direito", dataKey },
      { id: "esquerdo", label: "Lado Esquerdo", dataKey, espelhar: true },
    ];
    if (umaKey && desenhosData[umaKey]) {
      lados.push({ id: "uma-parede", label: "Uma Parede", dataKey: umaKey });
    }
    return { id: t.id, label: t.label, lados };
  });
  return {
    id: m.id,
    label: m.label,
    descricao: `${tamanhos.length} tamanhos`,
    tamanhos,
  };
});

/** Ids de cor (cor1, cor2, ...) de um desenho, ordenados numericamente. */
export function coresDoDesenho(dataKey: string | undefined): string[] {
  if (!dataKey) return [];
  const data = desenhosData[dataKey];
  if (!data) return [];
  const ids = data.paths
    .map((p) => p.colorId)
    .filter((id): id is string => !!id);
  return [...new Set(ids)].sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10);
    const nb = parseInt(b.replace(/\D/g, ""), 10);
    return na - nb;
  });
}
