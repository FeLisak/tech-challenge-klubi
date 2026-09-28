import Form from "next/form";
import Link from "next/link";

const SUGGESTIONS = ["BYD Dolphin em SP por uns 100 mil", "Dolphin até 80 mil", "Civic em São Paulo", "SUV até 100 mil"];

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
          className="h-12 w-full rounded-md sm:flex-1 border border-line bg-surface px-4 text-base text-ink outline-none placeholder:text-muted focus:border-ink"
        />
        <button className="h-12 rounded-md bg-ink px-6 font-medium text-white transition hover:bg-[#333] active:scale-[0.98]">
          Buscar
        </button>
      </Form>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Experimente:</span>
        {SUGGESTIONS.map((suggestion) => (
          <Link
            key={suggestion}
            href={{ pathname: "/", query: { q: suggestion } }}
            className="rounded-md border border-line bg-surface px-3 py-1 text-body transition hover:border-ink"
          >
            {suggestion}
          </Link>
        ))}
      </div>
    </div>
  );
}
