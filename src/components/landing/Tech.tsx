export default function Tech() {
  const techs = ["Supabase", "React + Vite", "Tailwind (design AURA)", "Netlify", "API REST & Intégrations"];
  return (
    <section id="tech" className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Une stack moderne pour des opérations sans friction</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {techs.map((t) => (
            <div key={t} className="rounded-xl border border-white/10 px-4 py-3 text-white/80">
              {t}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

