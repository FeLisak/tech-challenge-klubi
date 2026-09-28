import Image from "next/image";
import type { CSSProperties } from "react";
import { CATEGORY_LABELS } from "@/lib/cars";
import type { Match } from "@/lib/rank";

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const TONES = {
  green: "bg-green-bg text-green-fg",
  red: "bg-red-bg text-red-fg",
  yellow: "bg-brand-soft text-brand-deep",
  purple: "bg-purple-bg text-purple-fg",
};

type Tag = { tone: keyof typeof TONES; text: string };

// Cada tag explica por que o carro está nesta posição da lista.
function tagsFor(match: Match, { budget, city, categoryTag }: { budget: boolean; city: boolean; categoryTag?: string }): Tag[] {
  const tags: Tag[] = [];
  if (categoryTag && match.sameCategory) tags.push({ tone: "purple", text: categoryTag });
  if (budget) {
    tags.push(
      match.overBudget > 0
        ? { tone: "red", text: `${brl(match.overBudget)} acima do orçamento` }
        : { tone: "green", text: "Cabe no orçamento" },
    );
  }
  if (city) {
    tags.push(match.inCity ? { tone: "green", text: "Na sua cidade" } : { tone: "yellow", text: "Em outra cidade" });
  }
  return tags;
}

export function CarCard({
  match,
  index,
  budget,
  city,
  categoryTag,
  wide = false,
}: {
  match: Match;
  index: number;
  budget: boolean;
  city: boolean;
  // Texto da etiqueta de categoria; sem ele, a etiqueta não aparece.
  categoryTag?: string;
  // O carro que a pessoa pediu ganha destaque: foto grande ao lado das informações.
  wide?: boolean;
}) {
  const { car } = match;
  const name = `${car.Name} ${car.Model}`;

  return (
    <article
      style={{ "--index": index } as CSSProperties}
      className={`rise flex flex-col overflow-hidden rounded-3xl ${wide ? "sm:flex-row" : ""} bg-surface transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(37,42,45,0.08)]`}
    >
      <Image
        src={car.Image}
        alt={name}
        width={1280}
        height={720}
        sizes={wide ? "(min-width: 640px) 560px, 100vw" : "(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"}
        className={`aspect-[16/10] w-full object-cover ${wide ? "sm:w-3/5" : ""}`}
        priority={index < 3}
      />
      <div className={`flex flex-1 flex-col gap-3 ${wide ? "p-5 sm:p-8" : "p-5"}`}>
        <div>
          <h3 className="font-display text-lg font-bold tracking-tight text-ink">{name}</h3>
          <p className="text-sm text-muted">
            {car.Location} · {CATEGORY_LABELS[car.Category]} · {car.Fuel}
          </p>
        </div>
        <p className="font-display text-2xl font-extrabold tracking-tight text-ink">{brl(car.Price)}</p>
        <ul className="flex flex-wrap gap-1.5">
          {tagsFor(match, { budget, city, categoryTag }).map((tag) => (
            <li key={tag.text} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tag.tone]}`}>
              {tag.text}
            </li>
          ))}
        </ul>
        <a
          href="https://www.klubi.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-full bg-brand px-4 py-3 text-center font-display text-sm font-bold text-brand-ink transition hover:bg-brand-hover active:scale-[0.98]"
        >
          Simular consórcio<span className="sr-only"> para o {name} (abre em nova aba)</span>
        </a>
      </div>
    </article>
  );
}
