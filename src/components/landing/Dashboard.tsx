export default function Dashboard() {
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Une vision 360° sur votre événement</h2>
        <p className="mt-3 max-w-3xl text-white/80">
          Suivez en temps réel artistes confirmés, plannings, budgets, missions logistiques et plus.
          Go-Prod devient votre QG numérique — unifie vos flux et vos équipes.
        </p>
        <div className="mt-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-tr from-indigo-500/10 to-cyan-400/10 p-1 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&q=80"
            alt="Dashboard Go-Prod avec vue d'ensemble des événements"
            className="h-full w-full rounded-2xl object-cover"
          />
        </div>
      </div>
    </section>
  );
}

