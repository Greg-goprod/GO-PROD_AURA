export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0B1020] to-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-28">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">
              Nouveau • Go-Prod v2.0
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              La plateforme tout-en-un pour piloter vos événements
            </h1>
            <p className="mt-4 max-w-xl text-white/80">
              Centralisez artistes, contrats, logistique, planning et finances dans un seul outil.
              Conçu pour les festivals, productions et agences culturelles exigeantes.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                disabled
                className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg opacity-50 cursor-not-allowed"
              >
                Essai gratuit 14 jours
              </button>
              <button
                disabled
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/90 opacity-50 cursor-not-allowed"
              >
                Voir la démo
              </button>
              <span className="ml-1 text-xs text-white/50">Sans carte de crédit — Hébergé en Suisse</span>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[16/10] w-full rounded-2xl border border-white/10 bg-[#0E1530] p-4 shadow-2xl ring-1 ring-white/10 overflow-hidden">
              {/* Mockup Page Artistes */}
              <div className="h-full w-full flex flex-col gap-3">
                {/* Header mockup */}
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-24 rounded bg-indigo-500/20" />
                    <div className="h-6 w-16 rounded bg-white/5" />
                  </div>
                  <div className="h-8 w-32 rounded-lg bg-indigo-500/20" />
                </div>
                
                {/* Grid de cartes artistes */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {/* Card 1 */}
                  <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-indigo-500/30" />
                    <div className="h-3 w-24 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-12 rounded bg-emerald-400/30" />
                      <div className="h-2 w-16 rounded bg-blue-400/30" />
                    </div>
                  </div>
                  
                  {/* Card 2 */}
                  <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-blue-500/30" />
                    <div className="h-3 w-20 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-14 rounded bg-emerald-400/30" />
                      <div className="h-2 w-12 rounded bg-blue-400/30" />
                    </div>
                  </div>
                  
                  {/* Card 3 */}
                  <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-violet-500/30" />
                    <div className="h-3 w-28 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-16 rounded bg-emerald-400/30" />
                      <div className="h-2 w-14 rounded bg-blue-400/30" />
                    </div>
                  </div>
                  
                  {/* Card 4 */}
                  <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-rose-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-pink-500/30" />
                    <div className="h-3 w-16 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-12 rounded bg-emerald-400/30" />
                      <div className="h-2 w-18 rounded bg-blue-400/30" />
                    </div>
                  </div>
                  
                  {/* Card 5 */}
                  <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-emerald-500/30" />
                    <div className="h-3 w-24 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-14 rounded bg-emerald-400/30" />
                      <div className="h-2 w-12 rounded bg-blue-400/30" />
                    </div>
                  </div>
                  
                  {/* Card 6 */}
                  <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-3 flex flex-col gap-2">
                    <div className="h-20 w-full rounded-lg bg-orange-500/30" />
                    <div className="h-3 w-20 rounded bg-white/20" />
                    <div className="flex gap-2">
                      <div className="h-2 w-16 rounded bg-emerald-400/30" />
                      <div className="h-2 w-14 rounded bg-blue-400/30" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0B1020]/40 to-transparent pointer-events-none" />
            </div>
            <span id="demo" className="sr-only">Démo visuelle - Page artistes Go-Prod</span>
          </div>
        </div>
      </div>
    </section>
  );
}

