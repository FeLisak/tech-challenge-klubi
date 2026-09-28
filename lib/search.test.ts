import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Car } from "./cars.ts";
import { parseQuery } from "./parse.ts";
import { rank } from "./rank.ts";

const cars: Car[] = JSON.parse(readFileSync(new URL("../data/cars.json", import.meta.url), "utf8"));
const search = (query: string) => rank(cars, parseQuery(query, cars));
const models = (matches: { car: Car }[]) => matches.map((m) => m.car.Model);

test("entende preço, cidade e modelo como as pessoas escrevem", () => {
  assert.deepEqual(parseQuery("BYD Dolphin em SP por uns 100 mil", cars), {
    maxPrice: 100000, approx: true, model: "Dolphin", brand: "BYD", city: "São Paulo",
  });
  assert.deepEqual(parseQuery("dolfin até R$ 80.000", cars), { maxPrice: 80000, approx: false, model: "Dolphin" });
  assert.equal(parseQuery("t cross em campinas", cars).model, "T-Cross");
  assert.equal(parseQuery("vw no rio", cars).brand, "Volkswagen");
  assert.equal(parseQuery("vw no rio", cars).city, "Rio de Janeiro");
  assert.equal(parseQuery("sedã flex até 90k", cars).category, "sedan");
  assert.equal(parseQuery("sedã flex até 90k", cars).maxPrice, 90000);
});

test("número de modelo não vira preço", () => {
  assert.deepEqual(parseQuery("peugeot 208", cars), { model: "208", brand: "Peugeot" });
  assert.equal(parseQuery("hb20 até 80 mil", cars).maxPrice, 80000);
});

test("caso 1: o carro existe, no preço e na cidade", () => {
  const { requested } = search("BYD Dolphin em SP por uns 100 mil");
  assert.deepEqual(models(requested), ["Dolphin"]);
  assert.equal(requested[0].overBudget, 0);
  assert.equal(requested[0].inCity, true);
});

test("caso 2: o carro existe, mas acima do orçamento", () => {
  const { requested, alternatives } = search("Dolphin até 80 mil");
  assert.equal(requested[0].overBudget, 19990);
  // Primeiro os hatches que cabem, do mais próximo do orçamento para o mais distante.
  assert.deepEqual(models(alternatives.slice(0, 2)), ["HB20", "Kwid"]);
});

test("caso 3: o carro existe, mas em outra cidade", () => {
  const { requested, alternatives } = search("Civic em São Paulo");
  assert.equal(requested[0].inCity, false);
  assert.equal(requested[0].car.Location, "Rio de Janeiro");
  assert.equal(alternatives[0].car.Model, "Corolla");
  assert.equal(alternatives[0].inCity, true);
});

test("nenhuma busca termina em lista vazia", () => {
  for (const query of ["Tesla em Recife", "", "SUV até 50 mil"]) {
    const { requested, alternatives } = search(query);
    assert.equal(requested.length + alternatives.length, cars.length);
  }
});

test("busca sem modelo ordena pelo que foi pedido", () => {
  const { requested, alternatives } = search("SUV em SP até 100 mil");
  assert.equal(requested.length, 0);
  assert.equal(alternatives[0].car.Model, "Pulse");
});
