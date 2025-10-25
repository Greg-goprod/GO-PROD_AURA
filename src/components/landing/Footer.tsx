export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B1020]">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">Produit</h3>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white text-left">Fonctionnalités</button>
              <button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white text-left">Tarifs</button>
              <span className="text-white/50 cursor-not-allowed">Mises à jour</span>
              <span className="text-white/50 cursor-not-allowed">Roadmap</span>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Entreprise</h3>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <span className="text-white/50 cursor-not-allowed">À propos</span>
              <span className="text-white/50 cursor-not-allowed">Blog</span>
              <span className="text-white/50 cursor-not-allowed">Carrières</span>
              <span className="text-white/50 cursor-not-allowed">Contact</span>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ressources</h3>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <span className="text-white/50 cursor-not-allowed">Documentation</span>
              <span className="text-white/50 cursor-not-allowed">API</span>
              <span className="text-white/50 cursor-not-allowed">Support</span>
              <span className="text-white/50 cursor-not-allowed">Statut</span>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Légal</h3>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <span className="text-white/50 cursor-not-allowed">Confidentialité</span>
              <span className="text-white/50 cursor-not-allowed">Conditions</span>
              <span className="text-white/50 cursor-not-allowed">Cookies</span>
              <span className="text-white/50 cursor-not-allowed">Licences</span>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-indigo-500/20 ring-1 ring-indigo-400/40" />
            <span>© {new Date().getFullYear()} Go-Prod. Tous droits réservés.</span>
          </div>
          <div className="text-white/60">Dark-mode • Design AURA</div>
        </div>
      </div>
    </footer>
  );
}

