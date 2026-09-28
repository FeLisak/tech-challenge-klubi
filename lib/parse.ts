import type { Car } from "./cars.ts";

export type Filters = {
  brand?: string;
  model?: string;
  city?: string;
  category?: string;
  fuel?: string;
  maxPrice?: number;
  // "uns 100 mil" aceita um pouco acima; "até 100 mil" não.
  approx?: boolean;
};

export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

const compact = (text: string) => normalize(text).replace(/[^a-z0-9]/g, "");

const CITY_ALIASES: Record<string, string> = {
  sp: "São Paulo",
  sampa: "São Paulo",
  rio: "Rio de Janeiro",
  rj: "Rio de Janeiro",
  bh: "Belo Horizonte",
  poa: "Porto Alegre",
  cwb: "Curitiba",
};

const BRAND_ALIASES: Record<string, string> = {
  vw: "Volkswagen",
  chevy: "Chevrolet",
  gm: "Chevrolet",
};

const CATEGORY_WORDS: Record<string, string> = {
  suv: "suv",
  sedan: "sedan",
  seda: "sedan",
  hatch: "hatch",
};

const FUEL_WORDS: Record<string, string> = {
  eletrico: "elétrico",
  flex: "flex",
  gasolina: "gasolina",
};

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// Aceita erro de digitação proporcional ao tamanho: "dolfin" ainda é "dolphin".
function looksLike(word: string, target: string): boolean {
  if (word === target) return true;
  if (target.length < 4 || /\d/.test(target)) return false;
  return levenshtein(word, target) <= (target.length >= 7 ? 2 : 1);
}

const PRICE = /(ate|abaixo de|no maximo|maximo|menos de)?\s*(r\$\s*)?\b(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)\s*(mil|k)?\b/g;

function parsePrice(text: string): Pick<Filters, "maxPrice" | "approx"> {
  for (const [, limit, currency, number, thousand] of text.matchAll(PRICE)) {
    let value = Number(number.replace(/\./g, "").replace(",", "."));
    if (thousand) value *= 1000;
    // Sem "mil", "k" ou "R$", só é preço se tiver cara de preço: "208" é modelo.
    if (!thousand && !currency && value < 1000) continue;
    return { maxPrice: value, approx: !limit };
  }
  return {};
}

export function parseQuery(query: string, base: Car[]): Filters {
  const text = normalize(query).slice(0, 120);
  const words = text.split(/[^a-z0-9]+/).filter(Boolean);
  // "t cross" e "hb 20" chegam separados; juntar pares cobre esses nomes.
  const pairs = words.slice(1).map((word, i) => words[i] + word);
  const filters: Filters = parsePrice(text);

  for (const car of base) {
    const model = compact(car.Model);
    if ([...words, ...pairs].some((word) => looksLike(word, model))) filters.model = car.Model;
    if (words.includes(compact(car.Name))) filters.brand = car.Name;
    if (new RegExp(`\\b${normalize(car.Location)}\\b`).test(text)) filters.city = car.Location;
  }

  const vocabularies = [
    ["city", CITY_ALIASES],
    ["brand", BRAND_ALIASES],
    ["category", CATEGORY_WORDS],
    ["fuel", FUEL_WORDS],
  ] as const;
  for (const [key, vocabulary] of vocabularies) {
    const found = words.map((word) => vocabulary[word]).find(Boolean);
    if (found && !filters[key]) filters[key] = found;
  }

  return filters;
}

export type SearchParams = Record<string, string | string[] | undefined>;

export const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

// O texto livre dá o ponto de partida; o que a pessoa ajusta nos filtros vence o texto.
// Um filtro presente e vazio ("qualquer cidade") também vence: é uma escolha explícita.
export function readFilters(params: SearchParams, base: Car[]): Filters {
  const filters = parseQuery(first(params.q), base);
  const known = (key: string, values: string[]) => {
    const value = first(params[key]);
    return values.includes(value) ? value : undefined;
  };

  if ("modelo" in params) {
    delete filters.brand;
    filters.model = known("modelo", base.map((car) => car.Model));
  }
  if ("cidade" in params) filters.city = known("cidade", base.map((car) => car.Location));
  if ("categoria" in params) filters.category = known("categoria", base.map((car) => car.Category));
  if ("max" in params) {
    const max = Number(first(params.max));
    const valid = max > 0 && max < 10_000_000;
    filters.maxPrice = valid ? max : undefined;
    filters.approx = valid ? false : undefined;
  }

  for (const key of Object.keys(filters) as (keyof Filters)[]) {
    if (filters[key] === undefined) delete filters[key];
  }
  return filters;
}
