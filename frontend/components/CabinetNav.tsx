"use client";

import { usePathname } from "next/navigation";

// Navigation du cabinet praticienne — miroir de l'EspaceNav des clientes.
const ONGLETS = [
  { href: "/cabinet-ew", label: "Cabinet", icone: "✦" },
  { href: "/cabinet-ew/journal", label: "Journal", icone: "☾" },
  { href: "/cabinet-ew/clientes", label: "Clientes", icone: "✧" },
  { href: "/cabinet-ew/revenus", label: "Revenus", icone: "◈" },
];

export default function CabinetNav() {
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    // Sur téléphone, les trois pilules occupent toute la largeur et
    // « Déconnexion » passe à la ligne : plus d'onglet tronqué.
    <nav
      aria-label="Cabinet praticienne"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      {/* flex-wrap plutôt que défilement horizontal : à quatre onglets,
          le dernier sortait de l'écran sur téléphone sans qu'on le voie. */}
      <div className="flex w-full flex-wrap gap-1 rounded-3xl border border-greige/60 bg-ivory p-1 shadow-soft sm:w-auto sm:flex-1">
        {ONGLETS.map((o) => {
          const actif =
            o.href === "/cabinet-ew"
              ? pathname === o.href
              : pathname.startsWith(o.href);
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
        className="ml-auto whitespace-nowrap text-xs text-mention transition hover:text-red-600"
      >
        Déconnexion
      </button>
    </nav>
  );
}
