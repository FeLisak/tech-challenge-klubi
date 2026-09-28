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
      <header className="rounded-b-[2rem] bg-ink text-white">
        <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-20 sm:pt-20 sm:pb-24">
          <h1 className="max-w-2xl font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
            Encontre o carro certo, no seu orçamento.
          </h1>
          <p className="mt-4 max-w-xl text-white/70">
            Escreva do seu jeito: modelo, cidade e quanto quer pagar. A gente entende e mostra o que chega mais perto.
          </p>
          <div className="mt-8">
            <SearchBar query={query} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24">
        <section aria-label="Filtros" className="relative -mt-10 rounded-3xl bg-surface p-5 shadow-[0_8px_24px_rgba(37,42,45,0.08)] sm:p-6">
          {byAI && (
            <p className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted">
              <span className="rounded-full bg-purple-bg px-2.5 py-0.5 text-xs font-bold text-purple-fg">
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
            <h2 id="requested" className="font-display text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
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
          <h2 id="alternatives" className="font-display text-xl font-bold tracking-tight text-ink">
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

      <footer className="bg-ink py-8 text-center text-xs text-white/60">
        Fotos do Wikimedia Commons.{" "}
        <a href={CREDITS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-brand">
          Ver créditos dos autores
        </a>
      </footer>
    </>
  );
}
