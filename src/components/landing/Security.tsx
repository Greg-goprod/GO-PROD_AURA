export default function Security() {
  const items = [
    { icon: "🔐", text: "Authentification multi-facteurs (2FA)" },
    { icon: "🛡️", text: "Chiffrement des données au repos et en transit" },
    { icon: "👥", text: "Rôles et permissions granulaires" },
    { icon: "🇪🇺", text: "Hébergement en Europe (conforme RGPD)" },
    { icon: "📋", text: "Journaux d'audit complets" },
  ];
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Sécurité, performance et conformité au niveau entreprise</h2>
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.text} className="rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent px-4 py-3 text-white/80 flex items-center gap-3 hover:border-indigo-500/30 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

