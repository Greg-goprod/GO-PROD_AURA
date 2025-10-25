export default function Testimonials() {
  const items = [
    {
      quote:
        "Enfin une solution pensée par et pour les régisseurs. Fini les fichiers partagés dans tous les sens.",
      author: "Julie",
      role: "Directrice de Production, Festival Riviera",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80"
    },
    {
      quote:
        "Go-Prod a divisé par deux le temps de coordination entre nos équipes transport et technique.",
      author: "Sébastien",
      role: "Régisseur Général, EventScope",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80"
    },
    {
      quote:
        "Négociations, contrats, plannings : tout est synchronisé. On gagne en sérénité et en vitesse.",
      author: "Marc",
      role: "Responsable Booking",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&q=80"
    },
  ];
  return (
    <section className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-2xl font-bold">Adopté par les productions les plus exigeantes</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {items.map((t) => (
            <figure key={t.author} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6 hover:border-indigo-500/30 transition-all">
              <blockquote className="text-white/90 text-sm leading-relaxed">"{t.quote}"</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <img 
                  src={t.avatar} 
                  alt={t.author}
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10"
                />
                <div>
                  <div className="text-sm font-semibold text-white">{t.author}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

