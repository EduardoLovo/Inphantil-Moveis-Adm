// Metadados de catálogo client-safe (sem dependência de servidor).

export const CATEGORIES = [
  { value: "APLIQUE", slug: "apliques", label: "Apliques", singular: "aplique", hasQuantity: true, hasFazExterno: false, hasProntaKind: false },
  { value: "TAPETE", slug: "tapetes", label: "Tapetes", singular: "tapete", hasQuantity: false, hasFazExterno: false, hasProntaKind: false },
  { value: "CAMA", slug: "camas", label: "Camas", singular: "cama", hasQuantity: false, hasFazExterno: true, hasProntaKind: false },
  { value: "TECIDO_LENCOL", slug: "tecidos", label: "Tecidos para lençóis", singular: "tecido", hasQuantity: false, hasFazExterno: false, hasProntaKind: false },
  { value: "PRONTA_ENTREGA", slug: "pronta-entrega", label: "Lençóis, viróis e fronhas (pronta-entrega)", singular: "item", hasQuantity: true, hasFazExterno: false, hasProntaKind: true },
] as const;

export type CatalogCategoryValue = (typeof CATEGORIES)[number]["value"];
export type CategoryMeta = (typeof CATEGORIES)[number];

export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [
  CatalogCategoryValue,
  ...CatalogCategoryValue[],
];

export function categoryBySlug(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
export function categoryByValue(value: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.value === value);
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
  prontaKind: ProntaKind | null;
  createdAt: string;
};
