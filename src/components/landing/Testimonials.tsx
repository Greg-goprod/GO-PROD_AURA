export default function Testimonials() {
  const items = [
    {
      quote:
        "Enfin une solution pensée par et pour les régisseurs. Fini les fichiers partagés dans tous les sens.",
      author: "Julie • Directrice de Production, Festival Riviera",
    },
    {
      quote:
        "Go-Prod a divisé par deux le temps de coordination entre nos équipes transport et technique.",
      author: "Sébastien • Régisseur Général, EventScope",
    },
    {
      quote:
        "Négociations, contrats, plannings : tout est synchronisé. On gagne en sérénité et en vitesse.",
      author: "Marc • Responsable Booking",
    },
  ];
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Adopté par les productions les plus exigeantes</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.author} className="rounded-2xl border border-white/10 p-6">
              <blockquote className="text-white/90">"{t.quote}"</blockquote>
              <figcaption className="mt-3 text-sm text-white/60">{t.author}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

