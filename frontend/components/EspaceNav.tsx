"use client";

import { useEffect } from "react";
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

  // L'espace cliente est réservé aux CLIENTES : le compte praticienne y
  // est redirigé vers son cabinet. Le vécu a montré le danger — connectée
  // ici, modifier "son" numéro écrase celui de la ligne professionnelle.
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && (u.role === "consultant" || u.role === "admin")) {
        window.location.replace("/cabinet-ew");
      }
    } catch {
      /* user illisible : les gardes des pages (getMe) prennent le relais */
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  return (
    // Sur téléphone : pilules sur toute la largeur, Déconnexion en
    // dessous — sinon le dernier onglet se retrouve tronqué.
    <nav
      aria-label="Espace cliente"
      className="flex flex-wrap items-center gap-x-3 gap-y-2"
    >
      {/* flex-wrap plutôt que défilement horizontal : le dernier onglet
          sortait de l'écran sur téléphone sans qu'on le voie. */}
      <div className="flex w-full flex-wrap gap-1 rounded-3xl border border-greige/60 bg-ivory p-1 shadow-soft sm:w-auto sm:flex-1">
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
        className="ml-auto whitespace-nowrap text-xs text-mention transition hover:text-red-600"
      >
        Déconnexion
      </button>
    </nav>
  );
}
