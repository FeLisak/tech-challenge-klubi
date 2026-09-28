import type { Car } from "./cars.ts";
import type { Filters } from "./parse.ts";

export type Match = {
  car: Car;
  // Quanto o carro passa do orçamento; 0 quando cabe.
  overBudget: number;
  inCity: boolean;
  sameCategory: boolean;
};

export type Result = {
  // Os carros que a pessoa pediu pelo nome, mesmo quando não cabem no preço ou na cidade.
  requested: Match[];
  alternatives: Match[];
};

// Quem diz "uns 100 mil" não descarta um carro de R$ 100.500.
const APPROX_TOLERANCE = 1.1;

export function rank(base: Car[], filters: Filters): Result {
  const isRequested = (car: Car) =>
    (filters.model !== undefined || filters.brand !== undefined) &&
    (filters.model === undefined || car.Model === filters.model) &&
    (filters.brand === undefined || car.Name === filters.brand);

  const requestedCars = base.filter(isRequested);
  const category = filters.category ?? requestedCars[0]?.Category;
  const budget = filters.maxPrice && filters.maxPrice * (filters.approx ? APPROX_TOLERANCE : 1);
  const referencePrice = filters.maxPrice ?? requestedCars[0]?.Price;

  const toMatch = (car: Car): Match => ({
    car,
    overBudget: budget && car.Price > budget ? car.Price - filters.maxPrice! : 0,
    inCity: !filters.city || car.Location === filters.city,
    sameCategory: !category || car.Category === category,
  });

  // Prioridade dos parecidos: mesma categoria, depois mesma cidade, depois dentro do orçamento.
  const score = (m: Match) =>
    [m.sameCategory, m.inCity, m.overBudget === 0, !filters.fuel || m.car.Fuel === filters.fuel];
  const byScore = (a: Match, b: Match) => {
    const [sa, sb] = [score(a), score(b)];
    const i = sa.findIndex((v, k) => v !== sb[k]);
    if (i !== -1) return sa[i] ? -1 : 1;
    if (referencePrice === undefined) return a.car.Price - b.car.Price;
    return Math.abs(a.car.Price - referencePrice) - Math.abs(b.car.Price - referencePrice);
  };

  return {
    requested: requestedCars.map(toMatch).sort(byScore),
    alternatives: base.filter((car) => !isRequested(car)).map(toMatch).sort(byScore),
  };
}
