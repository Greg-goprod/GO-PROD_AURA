export default function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "CHF 29/mois",
      points: [
        "1 événement",
        "Jusqu'à 10 utilisateurs",
        "Modules de base",
        "Support email",
      ],
      cta: { label: "Démarrer l'essai" },
      badge: "",
    },
    {
      name: "Professional",
      price: "CHF 99/mois",
      points: [
        "5 événements",
        "Automatisations & analytics",
        "Accès API",
        "Support prioritaire",
      ],
      cta: { label: "Démarrer l'essai" },
      badge: "Le plus populaire",
    },
    {
      name: "Enterprise",
      price: "Sur devis",
      points: [
        "Événements illimités",
        "Marque blanche",
        "Intégrations custom",
        "SLA 24/7 & AM dédié",
      ],
      cta: { label: "Contacter les ventes" },
      badge: "",
    },
  ];

  return (
    <section id="pricing" className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Tarification simple et transparente</h2>
        <p className="mt-3 max-w-3xl text-white/80">
          Des plans flexibles selon vos besoins. Changez à tout moment.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {tiers.map((t, idx) => (
            <div key={t.name} className={`relative rounded-2xl border p-6 ${idx === 1 ? 'border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 scale-105' : 'border-white/10 bg-gradient-to-br from-white/5 to-transparent'} hover:scale-105 transition-transform`}>
              {t.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-1 text-xs font-semibold shadow-lg">
                  ⭐ {t.badge}
                </div>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <div className="mt-2 text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">{t.price}</div>
              <ul className="mt-4 grid gap-2 text-white/80">
                {t.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-sm">
                    <span className="text-green-400">✓</span> {p}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
              >
                {t.cta.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

