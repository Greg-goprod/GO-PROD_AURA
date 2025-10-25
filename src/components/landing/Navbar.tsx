import { Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B1020]/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/20 ring-1 ring-indigo-400/40" />
            <span className="text-lg font-semibold tracking-wide">Go-Prod</span>
          </div>

          <nav className="hidden items-center gap-6 md:flex">
            <button onClick={() => scrollToSection('features')} className="text-sm text-white/80 hover:text-white">Fonctionnalités</button>
            <button onClick={() => scrollToSection('modules')} className="text-sm text-white/80 hover:text-white">Modules</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm text-white/80 hover:text-white">Tarifs</button>
            <button onClick={() => scrollToSection('tech')} className="text-sm text-white/80 hover:text-white">Technologie</button>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <button disabled className="text-sm text-white/80 opacity-50 cursor-not-allowed">Se connecter</button>
            <button
              disabled
              className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md opacity-50 cursor-not-allowed"
            >
              Essai gratuit 14 jours
            </button>
          </div>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-white/10 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={18} />
          </button>
        </div>

        {open && (
          <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 md:hidden">
            <button onClick={() => scrollToSection('features')} className="text-sm text-white/80 hover:text-white text-left">Fonctionnalités</button>
            <button onClick={() => scrollToSection('modules')} className="text-sm text-white/80 hover:text-white text-left">Modules</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm text-white/80 hover:text-white text-left">Tarifs</button>
            <button onClick={() => scrollToSection('tech')} className="text-sm text-white/80 hover:text-white text-left">Technologie</button>
            <div className="mt-2 flex items-center gap-3">
              <button disabled className="text-sm text-white/80 opacity-50 cursor-not-allowed">Se connecter</button>
              <button
                disabled
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md opacity-50 cursor-not-allowed"
              >
                Essai gratuit 14 jours
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

