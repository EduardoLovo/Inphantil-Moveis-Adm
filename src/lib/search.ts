/**
 * Busca "solta" por palavras: o texto digitado é quebrado em termos e cada
 * termo precisa aparecer em algum lugar do texto pesquisado, em qualquer
 * ordem. Ignora acentos, maiúsculas e pontuação.
 *
 * Ex.: "cama queen" encontra "CAMA PHANT (SEM COLCHÃO) QUEEN".
 */

/** Minúsculas, sem acentos e com pontuação trocada por espaço. */
export function normalizeSearch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  const n = normalizeSearch(s);
  return n ? n.split(" ") : [];
}

/**
 * Pontua o quanto `text` combina com `query`. Retorna `null` se algum termo
 * não for encontrado; quanto maior o número, melhor o resultado.
 */
export function matchScore(text: string, query: string): number | null {
  const terms = tokens(query);
  if (terms.length === 0) return 0;

  const words = tokens(text);
  let score = 0;
  for (const term of terms) {
    if (words.includes(term)) score += 3; // palavra inteira
    else if (words.some((w) => w.startsWith(term))) score += 2; // início de palavra
    else if (words.some((w) => w.includes(term))) score += 1; // meio da palavra
    else return null;
  }
  return score;
}

/** Filtra e ordena `items` pelos que melhor combinam com `query`. */
export function fuzzyFilter<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
): T[] {
  if (!normalizeSearch(query)) return items;
  return items
    .map((item, i) => ({ item, i, score: matchScore(getText(item), query) }))
    .filter((r): r is { item: T; i: number; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.item);
}
