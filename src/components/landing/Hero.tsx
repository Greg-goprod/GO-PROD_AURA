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
            <div className="aspect-[16/10] w-full rounded-2xl border border-white/10 bg-gradient-to-tr from-indigo-500/10 to-cyan-400/10 p-1 shadow-2xl">
              <div className="h-full w-full rounded-2xl bg-[#0E1530] ring-1 ring-white/10">
                {/* Placeholder mockup */}
                <div className="grid h-full grid-rows-6 p-4">
                  <div className="row-span-1 flex items-center gap-2">
                    <div className="h-6 w-24 rounded bg-white/10" />
                    <div className="h-6 w-16 rounded bg-white/10" />
                  </div>
                  <div className="row-span-5 grid grid-cols-5 gap-3">
                    <div className="col-span-3 rounded-xl border border-white/10" />
                    <div className="col-span-2 grid gap-3">
                      <div className="h-24 rounded-xl border border-white/10" />
                      <div className="h-24 rounded-xl border border-white/10" />
                      <div className="h-24 rounded-xl border border-white/10" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <span id="demo" className="sr-only">Démo visuelle</span>
          </div>
        </div>
      </div>
    </section>
  );
}

