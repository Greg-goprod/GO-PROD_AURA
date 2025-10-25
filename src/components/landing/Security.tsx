export default function Security() {
  const items = [
    "Authentification multi-facteurs (2FA)",
    "Chiffrement des données au repos et en transit",
    "Rôles et permissions granulaires",
    "Hébergement en Europe (conforme RGPD)",
    "Journaux d'audit complets",
  ];
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Sécurité, performance et conformité au niveau entreprise</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {items.map((x) => (
            <li key={x} className="rounded-xl border border-white/10 px-4 py-3 text-white/80">
              {x}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

