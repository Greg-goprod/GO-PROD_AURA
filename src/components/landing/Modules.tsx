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

const colors = [
  "from-indigo-500/20 to-purple-500/20 border-indigo-500/30",
  "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
  "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30",
  "from-pink-500/20 to-rose-500/20 border-pink-500/30",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
  "from-orange-500/20 to-amber-500/20 border-orange-500/30",
];

export default function Modules() {
  return (
    <section id="modules" className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Tous les outils de production, réunis dans une seule plateforme</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, desc }, idx) => (
            <div key={title} className={`rounded-2xl border p-6 bg-gradient-to-br ${colors[idx]} hover:scale-105 transition-transform`}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-white/80">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

