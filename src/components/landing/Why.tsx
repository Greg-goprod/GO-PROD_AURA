export default function Why() {
  return (
    <section id="features" className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Remplacez Excel, emails et WhatsApp par un vrai cockpit de production</h2>
        <p className="mt-3 max-w-3xl text-white/80">
          Go-Prod centralise tous les départements — artistique, technique, logistique et administratif —
          dans un espace collaboratif unique. Gagnez du temps, évitez les doublons, alignez vos équipes.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Centralisation totale",
              desc: "Artistes, contrats, plannings, budgets, transports, hébergements — tout au même endroit."
            },
            {
              title: "Collaboration instantanée",
              desc: "Espaces dédiés par équipe, vision commune, commentaires et historiques contextualisés."
            },
            {
              title: "Automatisation intelligente",
              desc: "Workflows, rappels, génération de documents et notifications clés intégrées."
            }
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-white/75">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

