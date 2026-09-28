import Form from "next/form";
import Link from "next/link";

const SUGGESTIONS = [
  "BYD Dolphin em SP por uns 100 mil",
  "Dolphin até 80 mil",
  "Civic em São Paulo",
  "algo econômico pra família",
  "carro espaçoso pra viajar",
];

export function SearchBar({ query }: { query: string }) {
  return (
    <div>
      <Form action="/" className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Qual carro você procura?
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          maxLength={120}
          placeholder="Ex.: Dolphin em SP por uns 100 mil"
          className="h-14 w-full rounded-2xl bg-surface px-5 text-base text-ink outline-none ring-brand placeholder:text-muted focus:ring-2 sm:flex-1"
        />
        <button className="h-14 rounded-full bg-brand px-8 font-display font-bold text-brand-ink transition hover:bg-brand-hover active:scale-[0.98]">
          Buscar
        </button>
      </Form>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-white/60">Experimente:</span>
        {SUGGESTIONS.map((suggestion) => (
          <Link
            key={suggestion}
            href={{ pathname: "/", query: { q: suggestion } }}
            className="rounded-full border border-white/20 px-3.5 py-1 text-white/85 transition hover:border-brand hover:text-brand"
          >
            {suggestion}
          </Link>
        ))}
      </div>
    </div>
  );
}
