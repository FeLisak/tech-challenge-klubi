export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando resultados" className="flex-1">
      <div className="rounded-b-[2rem] bg-ink">
        <div className="mx-auto w-full max-w-5xl px-4 pt-14 pb-20 sm:pt-20 sm:pb-24">
          <div className="h-14 max-w-xl animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-8 h-14 animate-pulse rounded-2xl bg-white/10" />
        </div>
      </div>
      <main className="mx-auto w-full max-w-5xl px-4 pb-24">
        <div className="relative -mt-10 h-28 animate-pulse rounded-3xl bg-surface" />
        <div className="grid gap-4 pt-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-surface">
              <div className="aspect-[16/10] animate-pulse bg-bone" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-2/3 animate-pulse rounded bg-bone" />
                <div className="h-7 w-1/2 animate-pulse rounded bg-bone" />
                <div className="h-11 animate-pulse rounded-full bg-bone" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
