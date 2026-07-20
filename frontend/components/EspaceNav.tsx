"use client";

import { usePathname } from "next/navigation";

// Navigation commune de l'espace cliente — présente sur chaque page de
// l'espace pour circuler librement (remplace les liens "Retour").
const ONGLETS = [
  { href: "/dashboard", label: "Mon espace", icone: "✦" },
  { href: "/consultations", label: "Consultations", icone: "☾" },
  { href: "/profil", label: "Profil", icone: "✧" },
  { href: "/compte", label: "Compte", icone: "⚙" },
];

export default function EspaceNav() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    <nav aria-label="Espace cliente" className="flex items-center gap-3">
      <div className="flex flex-1 gap-1 overflow-x-auto rounded-full border border-greige/60 bg-ivory p-1 shadow-soft [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ONGLETS.map((o) => {
          const actif = pathname === o.href;
          return (
            <a
              key={o.href}
              href={o.href}
              aria-current={actif ? "page" : undefined}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                actif
                  ? "bg-aubergine text-cream shadow-card"
                  : "text-mention hover:bg-blush hover:text-aubergine"
              }`}
            >
              <span aria-hidden className={actif ? "text-gold-light" : "text-gold"}>
                {o.icone}
              </span>
              {o.label}
            </a>
          );
        })}
      </div>

      <button
        onClick={handleLogout}
        className="whitespace-nowrap text-xs text-mention transition hover:text-red-600"
      >
        Déconnexion
      </button>
    </nav>
  );
}
