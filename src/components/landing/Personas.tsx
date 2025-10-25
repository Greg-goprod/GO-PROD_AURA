export default function Personas() {
  const rows = [
    ["Directeur·trice de Production", "Vue d'ensemble, alertes, respect des budgets."],
    ["Régisseur·se Général·e", "Coordination technique/logistique, plannings dynamiques."],
    ["Responsable Booking", "Négociations, offres standardisées, contrats et suivi."],
    ["Chargé·e de Production", "Missions, transferts, hébergements, coordination terrain."],
    ["Technicien·ne / Crew", "Accès mobile, checklists, missions à jour en temps réel."],
  ];
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Pensé pour toutes les équipes de production</h2>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5 text-left text-white/70">
              <tr>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Bénéfice clé</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([a, b]) => (
                <tr key={a} className="border-t border-white/10">
                  <td className="px-4 py-3">{a}</td>
                  <td className="px-4 py-3 text-white/80">{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

