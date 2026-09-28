export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-24" aria-busy="true" aria-label="Carregando resultados">
      <div className="py-14 sm:py-20">
        <div className="h-14 max-w-xl animate-pulse rounded-md bg-bone" />
        <div className="mt-8 h-12 animate-pulse rounded-md bg-bone" />
      </div>
      <div className="grid gap-4 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
            <div className="aspect-[16/10] animate-pulse bg-bone" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 animate-pulse rounded bg-bone" />
              <div className="h-7 w-1/2 animate-pulse rounded bg-bone" />
              <div className="h-10 animate-pulse rounded bg-bone" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
