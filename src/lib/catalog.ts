// Metadados de catálogo client-safe (sem dependência de servidor).

// Categorias REAIS (onde o CRUD acontece).
export const CATEGORY_VALUES = [
  "APLIQUE",
  "SINTETICO",
  "TECIDO_LENCOL",
  "PRONTA_ENTREGA",
] as const;
export type CatalogCategoryValue = (typeof CATEGORY_VALUES)[number];

export type CategoryMeta = {
  value: CatalogCategoryValue;
  singular: string;
  hasQuantity: boolean;
  hasFazExterno: boolean;
  hasCabana: boolean;
  hasTapete: boolean;
  hasProntaKind: boolean;
};

export const CATEGORY_META: Record<CatalogCategoryValue, CategoryMeta> = {
  APLIQUE: {
    value: "APLIQUE",
    singular: "aplique",
    hasQuantity: true,
    hasFazExterno: false,
    hasCabana: true,
    hasTapete: false,
    hasProntaKind: false,
  },
  SINTETICO: {
    value: "SINTETICO",
    singular: "sintético",
    hasQuantity: false,
    hasFazExterno: true,
    hasCabana: false,
    hasTapete: true,
    hasProntaKind: false,
  },
  TECIDO_LENCOL: {
    value: "TECIDO_LENCOL",
    singular: "tecido",
    hasQuantity: false,
    hasFazExterno: false,
    hasCabana: false,
    hasTapete: false,
    hasProntaKind: false,
  },
  PRONTA_ENTREGA: {
    value: "PRONTA_ENTREGA",
    singular: "item",
    hasQuantity: true,
    hasFazExterno: false,
    hasCabana: false,
    hasTapete: false,
    hasProntaKind: true,
  },
};

// Flags que geram coleções filtradas.
export type CatalogFlag = "cabana" | "tapete";

// Coleções EXIBIDAS (hub, páginas e futuro mostruário). Algumas são a
// categoria inteira; outras são a categoria filtrada por uma flag.
export type Collection = {
  slug: string;
  label: string;
  category: CatalogCategoryValue;
  flag?: CatalogFlag;
};

export const COLLECTIONS: Collection[] = [
  { slug: "apliques", label: "Apliques", category: "APLIQUE" },
  { slug: "apliques-cabana", label: "Apliques para cabana", category: "APLIQUE", flag: "cabana" },
  { slug: "sinteticos", label: "Sintéticos", category: "SINTETICO" },
  { slug: "tapetes", label: "Tapetes", category: "SINTETICO", flag: "tapete" },
  { slug: "tecidos", label: "Tecidos para lençóis", category: "TECIDO_LENCOL" },
  { slug: "pronta-entrega", label: "Lençóis, viróis e fronhas (pronta-entrega)", category: "PRONTA_ENTREGA" },
];

export function collectionBySlug(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export const PRONTA_KINDS = [
  "LENCOL",
  "LENCOL_FRONHA",
  "VIROL",
  "VIROL_FRONHA",
  "FRONHA",
] as const;
export type ProntaKind = (typeof PRONTA_KINDS)[number];

export const PRONTA_KIND_LABEL: Record<ProntaKind, string> = {
  LENCOL: "Lençol",
  LENCOL_FRONHA: "Lençol + fronha",
  VIROL: "Virol",
  VIROL_FRONHA: "Virol + fronha",
  FRONHA: "Fronha",
};

export type CatalogItemFull = {
  id: string;
  category: CatalogCategoryValue;
  code: string;
  color: string;
  imageUrl: string | null;
  imageKey: string | null;
  available: boolean;
  quantity: number | null;
  fazExterno: boolean;
  cabana: boolean;
  tapete: boolean;
  prontaKind: ProntaKind | null;
  createdAt: string;
};
