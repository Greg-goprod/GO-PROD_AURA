export default function FinalCta() {
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Simplifiez votre production. Passez à Go-Prod.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-white/80">
          Lancez votre essai gratuit de 14 jours et découvrez une nouvelle manière de gérer vos événements.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled
            className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg opacity-50 cursor-not-allowed"
          >
            Essai gratuit
          </button>
          <button
            disabled
            className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/90 opacity-50 cursor-not-allowed"
          >
            Planifier une démo
          </button>
        </div>
      </div>
    </section>
  );
}

