"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GROUPES_ESPACE, ONGLETS_ESPACE, SOUS_LE_POUCE } from "@/lib/espace";
import { capitaliser } from "@/lib/format";
import { Icone } from "@/components/IconesEspace";
import { useElenaPresence, heureFr, jourRelatif } from "@/components/useElenaStatus";

// LE SHELL DE L'ESPACE CLIENTE — « Le Salon » (maquette validée par Elena
// le 10 octobre 2026, menu en trois registres le 14). Un tableau de bord
// doux : menu fixe à gauche sur ordinateur, barre d'onglets en bas sur
// téléphone, comme une application.
//
// EN TÊTE DU MENU, ELENA : sa photo, son statut, « Appeler maintenant ».
// Visible depuis chaque page — c'est le geste n°1, sans renommer l'onglet
// d'accueil. Hors ligne, la même carte dit quand revenir, en gris doux.
//
// Sur téléphone, douze entrées ne tiennent pas sous le pouce : quatre y
// sont, le reste dans « Plus » — la Déconnexion aussi (un geste rare).
//
// Le header et le footer du site ne s'affichent pas ici : le shell porte
// le logo (voir SiteHeader/SiteFooter).

interface Props {
  /** Pour la pastille utilisatrice — sinon lu dans le `user` local */
  prenom?: string | null;
  signe?: string | null;
  ascendant?: string | null;
  children: React.ReactNode;
}

/** Elena, en tête du menu : l'état, et la porte vers l'appel */
function CarteElenaMenu({ compact = false }: { compact?: boolean }) {
  const p = useElenaPresence();
  const enLigne = p.statut === "disponible";
  const enConsultation = p.statut === "en_consultation";
  const prochaine = p.permanence.prochaine;

  let titre = "Elena n'est pas en ligne";
  let sous = prochaine
    ? `prochaine permanence : ${jourRelatif(prochaine.debut)} ${heureFr(prochaine.debut)}`
    : "les consultations se font sur rendez-vous";
  let badge = "bg-statut-offline";
  let classeTitre = "text-mention";
  let fond = "bg-blush/70 ring-greige/60";
  if (enLigne) {
    titre = "Elena est en ligne";
    sous = "Appeler maintenant →";
    badge = "bg-statut-online";
    classeTitre = "text-statut-online";
    fond = "bg-statut-online/10 ring-statut-online/25 hover:bg-statut-online/15";
  } else if (enConsultation) {
    titre = "Elena est en consultation";
    sous = "elle se libère bientôt";
    badge = "bg-amber-500";
    classeTitre = "text-amber-700";
    fond = "bg-amber-50 ring-amber-200";
  } else if (p.statut === "chargement") {
    titre = "Elena";
    sous = "vérification…";
    badge = "bg-greige";
  }

  if (compact) {
    // Téléphone : un point sur l'étoile de l'onglet d'accueil, rien de plus
    return (
      <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-ivory ${badge}`} />
    );
  }

  return (
    <a
      href="/dashboard"
      className={`mb-4 flex items-center gap-3 rounded-2xl px-3 py-2.5 ring-1 transition ${fond}`}
    >
      <span className="relative inline-flex shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/elena-avatar.png"
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-cover ring-2 ring-white"
        />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          {enLigne && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ring-2 ring-white ${badge}`} />
        </span>
      </span>
      <span className="min-w-0">
        <span className={`block text-[13px] font-bold leading-tight ${classeTitre}`}>{titre}</span>
        <span className="block truncate text-[12px] text-ink/70">{sous}</span>
      </span>
    </a>
  );
}

export default function EspaceShell({ prenom, signe, ascendant, children }: Props) {
  const pathname = usePathname() ?? "";
  const [prenomLocal, setPrenomLocal] = useState("");
  const [plusOuvert, setPlusOuvert] = useState(false);

  // L'espace cliente est réservé aux CLIENTES : le compte praticienne y
  // est redirigé vers son cabinet. Le vécu a montré le danger — connectée
  // ici, modifier "son" numéro écrase celui de la ligne professionnelle.
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      window.location.replace("/login");
      return;
    }
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
  const estActif = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const classeLien = (actif: boolean) =>
    `flex min-h-[42px] items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[15px] transition ${
      actif
        ? "bg-aubergine font-semibold text-cream"
        : "font-medium text-mention hover:bg-blush hover:text-aubergine"
    }`;

  const pouce = SOUS_LE_POUCE.map((h) => ONGLETS_ESPACE.find((o) => o.href === h)!);
  const dansPlus = ONGLETS_ESPACE.filter((o) => !SOUS_LE_POUCE.includes(o.href));
  const plusActif = dansPlus.some((o) => estActif(o.href));

  return (
    <div className="espace-shell flex min-h-screen bg-cream font-jakarta">
      {/* ── Menu — bureau ── */}
      <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col overflow-y-auto border-r border-greige bg-ivory px-[18px] py-6 md:flex">
        <a href="/" className="mb-5 block px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/elena-wolska-logo.png"
            alt="Elena Wolska"
            width={146}
            height={52}
            className="h-[52px] w-auto"
          />
        </a>

        <CarteElenaMenu />

        <nav aria-label="Espace cliente" className="flex flex-col">
          {GROUPES_ESPACE.map((g, gi) => (
            <div key={gi} className={gi > 0 ? "mt-3 border-t border-greige/70 pt-3" : ""}>
              {g.titre && (
                <p className="mb-1 px-3.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
                  {g.titre}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {g.onglets.map((o) => {
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
              </div>
            </div>
          ))}
        </nav>

        {/* Bas de barre : la pastille utilisatrice, puis la sortie */}
        <div className="mt-6 pt-2">
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
            className="mt-2 min-h-[44px] px-3.5 text-xs text-mention transition hover:text-red-600"
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
            aria-label="Paramètres"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-aubergine text-sm font-semibold text-cream"
          >
            {initiale}
          </a>
        </header>

        {/* ── Contenu ── pb-28 sur téléphone : la barre d'onglets est
            fixée en bas, rien ne doit passer dessous. */}
        <div className="flex-1 px-5 pb-28 pt-4 md:px-12 md:pb-12 md:pt-10">
          <div className="max-w-[1140px]">{children}</div>
        </div>
      </div>

      {/* ── Panneau « Plus » — téléphone ── */}
      {plusOuvert && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setPlusOuvert(false)}>
          <div className="absolute inset-0 bg-aubergine/30" />
          <div
            role="dialog"
            aria-label="Plus"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-ivory px-5 pb-[calc(96px+env(safe-area-inset-bottom))] pt-5 shadow-soft"
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
        aria-label="Espace cliente"
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
              <span className="relative">
                <Icone nom={o.icone} taille={22} />
                {o.href === "/dashboard" && <CarteElenaMenu compact />}
              </span>
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
