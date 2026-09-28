import { brl, CarCard } from "./components/car-card";
import { FilterBar } from "./components/filter-bar";
import { SearchBar } from "./components/search-bar";
import { interpret, needsAI } from "@/lib/ai";
import { CATEGORY_LABELS, cars } from "@/lib/cars";
import { first, readFilters } from "@/lib/parse";
import { rank, type Match } from "@/lib/rank";

const CREDITS_URL = "https://github.com/FeLisak/tech-challenge-klubi/blob/main/docs/documentacao.md#créditos-das-imagens";

// "no Rio de Janeiro", mas "em São Paulo".
const where = (city: string) => (city === "Rio de Janeiro" ? `no ${city}` : `em ${city}`);

// A mensagem de cada caso de teste: encontrar, passar do orçamento ou estar em outra cidade.
function headline({ car, overBudget, inCity }: Match): { title: string; detail: string } {
  const name = `${car.Name} ${car.Model}`;
  if (overBudget > 0 && !inCity) {
    return {
      title: `O ${name} está ${where(car.Location)} e passa ${brl(overBudget)} do seu orçamento.`,
      detail: "No consórcio, o valor vira mensalidade sem juros. Abaixo, parecidos mais perto de você e no seu bolso.",
    };
  }
  if (overBudget > 0) {
    return {
      title: `O ${name} passa ${brl(overBudget)} do seu orçamento.`,
      detail: "No consórcio, o valor vira mensalidade sem juros. Ou veja abaixo parecidos que cabem hoje.",
    };
  }
  if (!inCity) {
    return {
      title: `O ${name} está disponível ${where(car.Location)}.`,
      detail: "Simule o consórcio para ele ou veja abaixo os parecidos mais perto de você.",
    };
  }
  return { title: `Encontramos seu ${name}.`, detail: "Está no seu orçamento e na sua cidade." };
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const query = first(params.q).slice(0, 120);
  let filters = readFilters(params, cars);
  // Filtros ajustados à mão já dizem o que a pessoa quer; a IA só interpreta o texto livre.
  const adjusted = ["modelo", "cidade", "categoria", "max"].some((key) => key in params);
  let byAI = false;
  if (!adjusted && needsAI(query, filters)) {
    const suggested = await interpret(query, cars);
    byAI = Object.keys(suggested).length > 0;
    filters = { ...suggested, ...filters };
  }
  const { requested, alternatives } = rank(cars, filters);
  const searched = Object.keys(filters).length > 0;
  const show = { budget: filters.maxPrice !== undefined, city: filters.city !== undefined };
  const main = requested[0] && headline(requested[0]);
  // Se a pessoa escolheu uma categoria diferente da do carro que buscou, os parecidos seguem a escolha dela.
  const chosenCategory =
    requested[0] && filters.category && filters.category !== requested[0].car.Category
      ? CATEGORY_LABELS[filters.category]
      : undefined;

  return (
    <>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24">
        <header className="py-14 sm:py-20">
          <h1 className="max-w-2xl font-serif text-4xl leading-[1.1] tracking-[-0.02em] text-ink sm:text-6xl">
            Encontre o carro certo, no seu orçamento.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Escreva do seu jeito: modelo, cidade e quanto quer pagar. A gente entende e mostra o que chega mais perto.
          </p>
          <div className="mt-8">
            <SearchBar query={query} />
          </div>
        </header>

        <section aria-label="Filtros" className="border-y border-line py-5">
          {byAI && (
            <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="rounded-full bg-blue-bg px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider text-blue-fg">
                Interpretado por IA
              </span>
              Estes filtros saíram da sua busca. Ajuste se não for bem isso.
            </p>
          )}
          <FilterBar
            key={JSON.stringify(filters)}
            query={query}
            filters={filters}
            base={cars}
            model={filters.model ?? (requested.length === 1 ? requested[0].car.Model : undefined)}
          />
        </section>

        {main && (
          <section className="pt-12" aria-labelledby="requested">
            <h2 id="requested" className="font-serif text-3xl leading-tight tracking-[-0.02em] text-ink">
              {main.title}
            </h2>
            <p className="mt-2 text-muted">{main.detail}</p>
            <div className="mt-6 grid gap-4">
              {requested.map((match, index) => (
                <CarCard key={match.car.Model} match={match} index={index} {...show} wide />
              ))}
            </div>
          </section>
        )}

        <section className="pt-12" aria-labelledby="alternatives">
          <h2 id="alternatives" className="text-xs font-medium uppercase tracking-wider text-muted">
            {chosenCategory
              ? `Opções na categoria ${chosenCategory}`
              : main
                ? `Parecidos com o ${requested[0].car.Model}`
                : searched
                  ? "Os melhores para a sua busca"
                  : "Todos os carros"}
          </h2>
          {query && !searched && (
            <p className="mt-2 text-muted">
              Não reconhecemos um modelo, cidade ou preço em “{query}”. Tente o nome do carro ou use os filtros acima.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((match, index) => (
              <CarCard
                key={match.car.Model}
                match={match}
                index={index}
                {...show}
                categoryTag={chosenCategory ? "Categoria escolhida" : main ? "Mesma categoria" : undefined}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Fotos do Wikimedia Commons.{" "}
        <a href={CREDITS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
          Ver créditos dos autores
        </a>
      </footer>
    </>
  );
}
