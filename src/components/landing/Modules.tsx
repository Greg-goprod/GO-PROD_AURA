import { FileSignature, BusFront, Hotel, CalendarClock, ChartPie, Megaphone } from "lucide-react";

const items = [
  {
    icon: FileSignature,
    title: "Artistes & Contrats",
    desc: "Profils enrichis, offres, contrats, signatures et historique complet.",
  },
  {
    icon: BusFront,
    title: "Ground & Logistique",
    desc: "Chauffeurs, véhicules, missions, plannings de terrain et checklists.",
  },
  {
    icon: Hotel,
    title: "Hospitality & Backstage",
    desc: "Hôtels, catering, accréditations, besoins spécifiques et rooming lists.",
  },
  {
    icon: CalendarClock,
    title: "Timetable & Régie",
    desc: "Planning technique détaillé, scènes, changeovers et ajustements temps réel.",
  },
  {
    icon: ChartPie,
    title: "Finances & Administration",
    desc: "Budgets, paiements, factures, reporting et intégrations comptables.",
  },
  {
    icon: Megaphone,
    title: "Presse & Communication",
    desc: "Contacts médias, accréditations, communiqués et retombées presse.",
  },
];

export default function Modules() {
  return (
    <section id="modules" className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Tous les outils de production, réunis dans une seule plateforme</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border border-white/10 p-6">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                <Icon size={18} />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-white/75">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

