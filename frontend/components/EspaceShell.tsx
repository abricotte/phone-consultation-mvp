"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ONGLETS_ESPACE } from "@/lib/espace";
import { capitaliser } from "@/lib/format";
import { Icone } from "@/components/IconesEspace";

// LE SHELL DE L'ESPACE CLIENTE — « Le Salon » (maquette validée par Elena
// le 10 octobre 2026). Un tableau de bord doux : menu fixe à gauche sur
// ordinateur, barre d'onglets en bas sur téléphone, comme une
// application. Les cinq pages de l'espace s'y glissent ; il remplace la
// barre de pilules que chaque page insérait sous le header global.
//
// Le header et le footer du site ne s'affichent pas ici : le shell
// porte le logo, un deuxième ferait doublon (voir SiteHeader/SiteFooter).

interface Props {
  /** Pour la pastille utilisatrice — sinon lu dans le `user` local */
  prenom?: string | null;
  signe?: string | null;
  ascendant?: string | null;
  children: React.ReactNode;
}

export default function EspaceShell({ prenom, signe, ascendant, children }: Props) {
  const pathname = usePathname();
  const [prenomLocal, setPrenomLocal] = useState("");

  // L'espace cliente est réservé aux CLIENTES : le compte praticienne y
  // est redirigé vers son cabinet. Le vécu a montré le danger — connectée
  // ici, modifier "son" numéro écrase celui de la ligne professionnelle.
  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (u && (u.role === "consultant" || u.role === "admin")) {
        window.location.replace("/cabinet-ew");
        return;
      }
      if (u?.firstName) setPrenomLocal(u.firstName);
    } catch {
      /* user illisible : les gardes des pages (getMe) prennent le relais */
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  const nom = capitaliser(prenom || prenomLocal);
  const initiale = nom ? nom.charAt(0).toUpperCase() : "·";
  const estActif = (href: string) =>
    pathname === href || !!pathname?.startsWith(href + "/");

  return (
    <div className="espace-shell flex min-h-screen bg-cream font-jakarta">
      {/* ── Barre latérale — bureau ── */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-greige bg-ivory px-[18px] py-7 md:flex">
        <a href="/" className="mb-7 block px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/elena-wolska-logo.png"
            alt="Elena Wolska"
            width={146}
            height={52}
            className="h-[52px] w-auto"
          />
        </a>

        <nav aria-label="Espace cliente" className="flex flex-col gap-1">
          {ONGLETS_ESPACE.map((o) => {
            const actif = estActif(o.href);
            return (
              <a
                key={o.href}
                href={o.href}
                aria-current={actif ? "page" : undefined}
                className={`flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] transition ${
                  actif
                    ? "bg-aubergine font-semibold text-cream"
                    : "font-medium text-mention hover:bg-blush hover:text-aubergine"
                }`}
              >
                <Icone nom={o.icone} taille={18} className={actif ? "text-gold-light" : "text-gold"} />
                {o.label}
              </a>
            );
          })}
        </nav>

        {/* Bas de barre : la pastille utilisatrice, puis la sortie */}
        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-2xl bg-blush p-3.5">
            <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-aubergine text-sm font-semibold text-cream">
              {initiale}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-aubergine">
                {nom || "Mon espace"}
              </span>
              {signe && (
                <span className="block truncate text-xs text-mention">
                  {signe}
                  {ascendant ? ` · asc. ${ascendant}` : ""}
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 min-h-[44px] px-3.5 text-xs text-mention transition hover:text-red-600"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* ── En-tête réduit — téléphone ── */}
        <header className="flex items-center justify-between px-5 pb-2 pt-4 md:hidden">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/elena-wolska-logo.png"
              alt="Elena Wolska"
              width={112}
              height={40}
              className="h-10 w-auto"
            />
          </a>
          <a
            href="/compte"
            aria-label="Mon compte"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-aubergine text-sm font-semibold text-cream"
          >
            {initiale}
          </a>
        </header>

        {/* ── Contenu ── pb-28 sur téléphone : la barre d'onglets est
            fixée en bas, rien ne doit passer dessous. */}
        <div className="flex-1 px-5 pb-28 pt-4 md:px-12 md:pb-12 md:pt-10">
          <div className="max-w-[1040px]">{children}</div>

          {/* Sur téléphone la Déconnexion vit dans l'onglet Compte,
              pas dans la barre : c'est un geste rare, pas un onglet. */}
          {pathname === "/compte" && (
            <button
              type="button"
              onClick={handleLogout}
              className="mt-10 min-h-[44px] text-sm text-mention underline decoration-greige underline-offset-4 transition hover:text-red-600 md:hidden"
            >
              Déconnexion
            </button>
          )}
        </div>
      </div>

      {/* ── Barre d'onglets — téléphone ── */}
      <nav
        aria-label="Espace cliente"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-greige bg-ivory px-2 pb-[calc(22px+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
      >
        {ONGLETS_ESPACE.map((o) => {
          const actif = estActif(o.href);
          return (
            <a
              key={o.href}
              href={o.href}
              aria-current={actif ? "page" : undefined}
              className={`flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-1 text-[10px] ${
                actif ? "font-semibold text-aubergine" : "font-medium text-mention"
              }`}
            >
              <Icone nom={o.icone} taille={22} />
              {o.court}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
