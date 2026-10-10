"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Icone, type NomIcone } from "@/components/IconesEspace";

// LE SHELL DU CABINET — le « Salon » d'Elena, miroir de celui des
// clientes (EspaceShell). Menu fixe à gauche sur ordinateur, barre
// d'onglets en bas sur téléphone. Les neuf pages du cabinet s'y glissent
// sans changer de contenu ; il remplace la barre de pilules (CabinetNav).
//
// Ordre voulu par Elena, de haut en bas : d'abord ce qui pilote la
// journée (Cabinet, Permanences, Calendly), puis les personnes
// (Clientes), puis ce qu'on consulte (Journal, Revenus), puis soi
// (Profil), puis sa parole aux clientes (Le mot d'Elena).
//
// Sur téléphone, huit onglets ne tiennent pas sous le pouce : la barre
// porte les QUATRE gestes du quotidien, et « Plus » ouvre le reste —
// « la page d'arrivée sert ce que tu fais tous les jours, un onglet
// sert ce que tu fais toutes les semaines ». La Déconnexion vit dans
// « Plus » : un geste rare, pas un onglet.
//
// Le cabinet vit sur une URL non référencée, protégée par le rôle : le
// header et le footer du site ne s'affichent pas ici (voir lib/espace).

const ONGLETS: { href: string; label: string; court: string; icone: NomIcone }[] = [
  { href: "/cabinet-ew", label: "Cabinet", court: "Cabinet", icone: "etoile" },
  { href: "/cabinet-ew/permanences", label: "Permanences", court: "Permanences", icone: "permanences" },
  { href: "/cabinet-ew/calendly", label: "Calendly", court: "Calendly", icone: "reserver" },
  { href: "/cabinet-ew/clientes", label: "Clientes", court: "Clientes", icone: "clientes" },
  { href: "/cabinet-ew/journal", label: "Journal", court: "Journal", icone: "lune" },
  { href: "/cabinet-ew/revenus", label: "Revenus", court: "Revenus", icone: "revenus" },
  { href: "/cabinet-ew/profil", label: "Profil", court: "Profil", icone: "compte" },
  { href: "/cabinet-ew/mot", label: "Le mot d'Elena", court: "Le mot", icone: "modifier" },
];

/** Sous le pouce : les quatre gestes du quotidien. Le reste dans « Plus ». */
const SOUS_LE_POUCE = ["/cabinet-ew", "/cabinet-ew/clientes", "/cabinet-ew/permanences", "/cabinet-ew/calendly"];

export default function CabinetShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const [plusOuvert, setPlusOuvert] = useState(false);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  const estActif = (href: string) =>
    href === "/cabinet-ew" ? pathname === href : pathname.startsWith(href);

  const pouce = SOUS_LE_POUCE.map((h) => ONGLETS.find((o) => o.href === h)!);
  const dansPlus = ONGLETS.filter((o) => !SOUS_LE_POUCE.includes(o.href));
  const plusActif = dansPlus.some((o) => estActif(o.href));

  const classeLien = (actif: boolean) =>
    `flex min-h-[44px] items-center gap-3 rounded-2xl px-3.5 py-3 text-[15px] transition ${
      actif
        ? "bg-aubergine font-semibold text-cream"
        : "font-medium text-mention hover:bg-blush hover:text-aubergine"
    }`;

  return (
    <div className="cabinet-shell flex min-h-screen bg-cream font-jakarta">
      {/* ── Menu — bureau ── */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col border-r border-greige bg-ivory px-[18px] py-7 md:flex">
        <a href="/cabinet-ew" className="mb-7 block px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/elena-wolska-logo.png"
            alt="Elena Wolska"
            width={146}
            height={52}
            className="h-[52px] w-auto"
          />
        </a>

        <nav aria-label="Cabinet praticienne" className="flex flex-col gap-1">
          {ONGLETS.map((o) => {
            const actif = estActif(o.href);
            return (
              <a
                key={o.href}
                href={o.href}
                aria-current={actif ? "page" : undefined}
                className={classeLien(actif)}
              >
                <Icone nom={o.icone} taille={18} className={actif ? "text-gold-light" : "text-gold"} />
                {o.label}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="flex items-center gap-3 rounded-2xl bg-blush p-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/elena-avatar.png"
              alt=""
              width={34}
              height={34}
              className="h-[34px] w-[34px] shrink-0 rounded-full object-cover"
            />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-aubergine">Elena</span>
              <span className="block text-xs text-mention">praticienne</span>
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
          <a href="/cabinet-ew">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/elena-wolska-logo.png"
              alt="Elena Wolska"
              width={112}
              height={40}
              className="h-10 w-auto"
            />
          </a>
          <a href="/cabinet-ew/profil" aria-label="Mon profil">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/elena-avatar.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          </a>
        </header>

        {/* ── Contenu ── pb-28 sur téléphone : rien ne passe sous la barre */}
        <div className="flex-1 px-5 pb-28 pt-4 md:px-12 md:pb-12 md:pt-10">
          <div className="max-w-4xl">{children}</div>
        </div>
      </div>

      {/* ── Panneau « Plus » — téléphone ── */}
      {plusOuvert && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setPlusOuvert(false)}>
          <div className="absolute inset-0 bg-aubergine/30" />
          <div
            role="dialog"
            aria-label="Plus"
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-ivory px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">Plus</p>
              <button
                type="button"
                onClick={() => setPlusOuvert(false)}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full text-mention"
              >
                <Icone nom="croix" taille={20} />
              </button>
            </div>
            <ul className="space-y-1">
              {dansPlus.map((o) => {
                const actif = estActif(o.href);
                return (
                  <li key={o.href}>
                    <a href={o.href} aria-current={actif ? "page" : undefined} className={classeLien(actif)}>
                      <Icone nom={o.icone} taille={18} className={actif ? "text-gold-light" : "text-gold"} />
                      {o.label}
                    </a>
                  </li>
                );
              })}
              <li className="mt-2 border-t border-greige pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-[48px] w-full items-center px-3.5 text-sm text-mention"
                >
                  Déconnexion
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Barre d'onglets — téléphone : 4 + Plus ── */}
      <nav
        aria-label="Cabinet praticienne"
        className="fixed inset-x-0 bottom-0 z-50 flex justify-around border-t border-greige bg-ivory px-2 pb-[calc(22px+env(safe-area-inset-bottom))] pt-2.5 md:hidden"
      >
        {pouce.map((o) => {
          const actif = estActif(o.href) && !plusOuvert;
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
        <button
          type="button"
          onClick={() => setPlusOuvert((v) => !v)}
          aria-expanded={plusOuvert}
          className={`flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-1 text-[10px] ${
            plusOuvert || plusActif ? "font-semibold text-aubergine" : "font-medium text-mention"
          }`}
        >
          <Icone nom="plus" taille={22} />
          Plus
        </button>
      </nav>
    </div>
  );
}
