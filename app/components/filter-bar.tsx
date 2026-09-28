import Form from "next/form";
import { CATEGORY_LABELS, type Car } from "@/lib/cars";
import type { Filters } from "@/lib/parse";
import { AutoSubmitSelect } from "./auto-submit-select";

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function FilterBar({ query, filters, base, model }: { query: string; filters: Filters; base: Car[]; model?: string }) {
  const field = "h-11 w-full min-w-0 rounded-xl border border-line bg-surface px-3 text-sm font-normal normal-case tracking-normal text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";
  const label = "flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-ink";

  return (
    <Form action="/" className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto] sm:items-end">
      <input type="hidden" name="q" value={query} />
      <label className={label}>
        Modelo
        <AutoSubmitSelect name="modelo" defaultValue={model ?? ""} className={field}>
          <option value="">Qualquer modelo</option>
          {base.map((car) => (
            <option key={car.Model} value={car.Model}>
              {car.Name} {car.Model}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className={label}>
        Cidade
        <AutoSubmitSelect name="cidade" defaultValue={filters.city ?? ""} className={field}>
          <option value="">Qualquer cidade</option>
          {unique(base.map((car) => car.Location)).map((city) => (
            <option key={city}>{city}</option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className={label}>
        Categoria
        <AutoSubmitSelect name="categoria" defaultValue={filters.category ?? ""} className={field}>
          <option value="">Qualquer categoria</option>
          {unique(base.map((car) => car.Category)).map((category) => (
            <option key={category} value={category}>
              {CATEGORY_LABELS[category] ?? category}
            </option>
          ))}
        </AutoSubmitSelect>
      </label>
      <label className={label}>
        Até (R$)
        <input
          name="max"
          type="number"
          inputMode="numeric"
          min={0}
          step={1000}
          defaultValue={filters.maxPrice ?? ""}
          placeholder="Sem limite"
          className={field}
        />
      </label>
      <button className="col-span-2 h-11 rounded-full bg-ink px-6 font-display text-sm font-bold text-white transition hover:bg-black active:scale-[0.98] sm:col-span-1">
        Aplicar
      </button>
    </Form>
  );
}
