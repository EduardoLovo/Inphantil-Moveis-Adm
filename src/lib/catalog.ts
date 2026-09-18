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
  hasApenasTapete: boolean;
  hasProntaKind: boolean;
};

export const CATEGORY_META: Record<CatalogCategoryValue, CategoryMeta> = {
  APLIQUE: {
    value: "APLIQUE",
    singular: "aplique",
    hasQuantity: true,
    hasFazExterno: false,
    hasCabana: true,
    hasApenasTapete: false,
    hasProntaKind: false,
  },
  SINTETICO: {
    value: "SINTETICO",
    singular: "sintético",
    hasQuantity: false,
    hasFazExterno: true,
    hasCabana: false,
    hasApenasTapete: true,
    hasProntaKind: false,
  },
  TECIDO_LENCOL: {
    value: "TECIDO_LENCOL",
    singular: "tecido",
    hasQuantity: false,
    hasFazExterno: false,
    hasCabana: false,
    hasApenasTapete: false,
    hasProntaKind: false,
  },
  PRONTA_ENTREGA: {
    value: "PRONTA_ENTREGA",
    singular: "item",
    hasQuantity: true,
    hasFazExterno: false,
    hasCabana: false,
    hasApenasTapete: false,
    hasProntaKind: true,
  },
};

// Filtro declarativo por características booleanas do item.
export type CollectionFilter = {
  cabana?: boolean;
  apenasTapete?: boolean;
};

// Coleções EXIBIDAS (hub de gestão e mostruário público).
// - `filter`: aplicado em gestão E mostruário.
// - `publicFilter`: aplicado SÓ no mostruário (a gestão mostra tudo da categoria).
// - `inHub`: se aparece no gerenciador de catálogo (default true).
export type Collection = {
  slug: string;
  label: string;
  category: CatalogCategoryValue;
  filter?: CollectionFilter;
  publicFilter?: CollectionFilter;
  inHub?: boolean;
};

export const COLLECTIONS: Collection[] = [
  { slug: "apliques", label: "Apliques", category: "APLIQUE" },
  { slug: "apliques-cabana", label: "Apliques para cabana", category: "APLIQUE", filter: { cabana: true } },
  // Sintéticos: a gestão mostra todos; o mostruário de "cama" esconde os "apenas tapete".
  { slug: "sinteticos", label: "Sintéticos", category: "SINTETICO", publicFilter: { apenasTapete: false } },
  // Tapetes: só no mostruário, com TODOS os sintéticos (independente da flag).
  { slug: "tapetes", label: "Tapetes", category: "SINTETICO", inHub: false },
  { slug: "tecidos", label: "Tecidos para lençóis", category: "TECIDO_LENCOL" },
  { slug: "pronta-entrega", label: "Lençóis, viróis e fronhas (pronta-entrega)", category: "PRONTA_ENTREGA" },
];

/** Coleções gerenciáveis no hub de catálogo. */
export const HUB_COLLECTIONS = COLLECTIONS.filter((c) => c.inHub !== false);

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
  apenasTapete: boolean;
  prontaKind: ProntaKind | null;
  createdAt: string;
};
