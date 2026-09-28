import Image from "next/image";
import type { CSSProperties } from "react";
import { CATEGORY_LABELS } from "@/lib/cars";
import type { Match } from "@/lib/rank";

export const brl = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const TONES = {
  green: "bg-green-bg text-green-fg",
  red: "bg-red-bg text-red-fg",
  yellow: "bg-yellow-bg text-yellow-fg",
  blue: "bg-blue-bg text-blue-fg",
};

type Tag = { tone: keyof typeof TONES; text: string };

// Cada tag explica por que o carro está nesta posição da lista.
function tagsFor(match: Match, { budget, city, alternative }: { budget: boolean; city: boolean; alternative: boolean }): Tag[] {
  const tags: Tag[] = [];
  if (alternative && match.sameCategory) tags.push({ tone: "blue", text: "Mesma categoria" });
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
  alternative,
  wide = false,
}: {
  match: Match;
  index: number;
  budget: boolean;
  city: boolean;
  alternative: boolean;
  // O carro que a pessoa pediu ganha destaque: foto grande ao lado das informações.
  wide?: boolean;
}) {
  const { car } = match;
  const name = `${car.Name} ${car.Model}`;

  return (
    <article
      style={{ "--index": index } as CSSProperties}
      className={`rise flex flex-col overflow-hidden rounded-xl ${wide ? "sm:flex-row" : ""} border border-line bg-surface transition-shadow duration-200 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]`}
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
          <h3 className="text-lg font-semibold tracking-tight text-ink">{name}</h3>
          <p className="text-sm text-muted">
            {car.Location} · {CATEGORY_LABELS[car.Category]} · {car.Fuel}
          </p>
        </div>
        <p className="text-2xl font-semibold tracking-tight text-ink">{brl(car.Price)}</p>
        <ul className="flex flex-wrap gap-1.5">
          {tagsFor(match, { budget, city, alternative }).map((tag) => (
            <li key={tag.text} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider ${TONES[tag.tone]}`}>
              {tag.text}
            </li>
          ))}
        </ul>
        <a
          href="https://www.klubi.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-md bg-ink px-4 py-2.5 text-center text-sm font-medium text-white transition hover:bg-[#333] active:scale-[0.98]"
        >
          Simular consórcio<span className="sr-only"> para o {name} (abre em nova aba)</span>
        </a>
      </div>
    </article>
  );
}
