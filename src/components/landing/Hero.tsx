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
              <img
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=750&fit=crop&q=80"
                alt="Interface Go-Prod - Page artistes avec données et statistiques"
                className="h-full w-full rounded-2xl object-cover ring-1 ring-white/10"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-[#0B1020]/60 to-transparent" />
            </div>
            <span id="demo" className="sr-only">Démo visuelle</span>
          </div>
        </div>
      </div>
    </section>
  );
}

