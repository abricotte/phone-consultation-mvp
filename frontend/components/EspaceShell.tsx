"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { usePathname } from "next/navigation";
import { GROUPES_ESPACE, ONGLETS_ESPACE, SOUS_LE_POUCE } from "@/lib/espace";
import { capitaliser } from "@/lib/format";
import { Icone, type NomIcone } from "@/components/IconesEspace";
import Embleme from "@/components/Embleme";
import { emblemeLocal, memoriserEmbleme } from "@/lib/emblemes";
import { useElenaPresence, heureFr, jourRelatif } from "@/components/useElenaStatus";

// LE SHELL DE L'ESPACE CLIENTE — « Le Salon » (maquette validée par Elena
// le 10 octobre 2026, menu en trois registres le 14). Un tableau de bord
// doux : menu fixe à gauche sur ordinateur, barre d'onglets en bas sur
// téléphone, comme une application.
//
// EN TÊTE DU MENU, LE BLOC « CONSULTER ELENA » (15 octobre) : dans un
// encadré de couleur, tout ce qui sert à appeler — l'état d'Elena, le
// bouton (appeler si elle est en ligne, sinon prendre rendez-vous), le
// crédit et « Recharger », puis Mon espace, Consultations, Mon crédit.
// La cliente qui veut appeler ne se perd pas. Sur téléphone, le bouton
// d'appel est en haut de chaque écran.
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

const RENDEZ_VOUS = "https://elena-wolska.com/disponibilites";

/** L'état d'Elena, partagé par le bloc d'appel et les pastilles du téléphone */
function etatElena(p: ReturnType<typeof useElenaPresence>) {
  const enLigne = p.statut === "disponible";
  const enConsultation = p.statut === "en_consultation";
  const prochaine = p.permanence.prochaine;
  if (enLigne) return { enLigne, enConsultation, titre: "Elena est en ligne", sous: "vous pouvez l'appeler maintenant", badge: "bg-statut-online" };
  if (enConsultation) return { enLigne, enConsultation, titre: "Elena est en consultation", sous: "elle se libère bientôt", badge: "bg-amber-500" };
  if (p.statut === "chargement") return { enLigne, enConsultation, titre: "Elena", sous: "vérification…", badge: "bg-greige" };
  return {
    enLigne,
    enConsultation,
    titre: "Elena n'est pas en ligne",
    sous: prochaine ? `prochaine permanence : ${jourRelatif(prochaine.debut)} ${heureFr(prochaine.debut)}` : "les consultations se font sur rendez-vous",
    badge: "bg-statut-offline",
  };
}

/** LE BLOC « CONSULTER ELENA » — tout ce qui sert à appeler, dans un encadré
 *  de couleur, en tête du menu : l'état d'Elena, le bouton (appeler, ou
 *  prendre rendez-vous), le crédit et « Recharger », puis Mon espace,
 *  Consultations, Mon crédit. La cliente qui veut appeler ne se perd pas. */
function BlocAppel({
  onglets,
  estActif,
  soldeEuros,
}: {
  onglets: { href: string; label: string; icone: NomIcone }[];
  estActif: (h: string) => boolean;
  soldeEuros: number | null;
}) {
  const p = useElenaPresence();
  const e = etatElena(p);
  const prochaine = p.permanence.prochaine;
  // Deux lignes courtes, jamais plus : l'état, et quand revenir
  const titre = e.enLigne ? "Elena est en ligne" : e.enConsultation ? "En consultation" : p.statut === "chargement" ? "Elena" : "Hors ligne";
  const sous = e.enLigne
    ? "à la minute"
    : e.enConsultation
      ? "elle se libère bientôt"
      : prochaine
        ? `de retour ${jourRelatif(prochaine.debut)} ${heureFr(prochaine.debut)}`
        : "sur rendez-vous";
  const solde = soldeEuros === null ? null : `${soldeEuros.toFixed(2).replace(".", ",").replace(",00", "")} €`;

  return (
    <section aria-label="Consulter Elena" className="mb-5 rounded-3xl bg-gradient-to-br from-[#FBF3E2] to-[#F5E3BD] px-4 pb-3 pt-4 shadow-soft ring-1 ring-gold/40">
      <div className="flex items-center gap-3">
        <span className="relative inline-flex shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/elena-avatar.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover ring-2 ring-white" />
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            {e.enLigne && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />}
            <span className={`relative inline-flex h-3 w-3 rounded-full ring-2 ring-white ${e.badge}`} />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block whitespace-nowrap text-[14px] font-bold leading-tight text-aubergine">{titre}</span>
          <span className="block whitespace-nowrap text-[12px] leading-snug text-ink/65">{sous}</span>
        </span>
      </div>

      {/* Deux boutons, toujours là, toujours à la même place : celui qui sert
          tout de suite est plein, l'autre est dessous, en contour. */}
      <div className="mt-4 flex flex-col gap-2">
        <a
          href="/dashboard"
          className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-3 py-3 text-[14.5px] font-bold transition ${
            e.enLigne
              ? "order-1 bg-statut-online text-white shadow-card hover:brightness-110"
              : "order-2 bg-white/80 text-aubergine ring-1 ring-gold/40 hover:bg-white"
          }`}
        >
          <Icone nom="appeler" taille={17} />
          J&apos;appelle Elena
        </a>
        <a
          href={RENDEZ_VOUS}
          className={`flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl px-3 py-3 text-[14.5px] font-bold transition ${
            e.enLigne
              ? "order-2 bg-white/80 text-aubergine ring-1 ring-gold/40 hover:bg-white"
              : "order-1 bg-cta text-cta-text shadow-card hover:bg-cta-dark"
          }`}
        >
          <Icone nom="reserver" taille={17} />
          Rendez-vous
        </a>
      </div>

      <div className="mt-4 flex flex-col gap-1 border-t border-gold/30 pt-3">
        {onglets.map((o) => {
          const actif = estActif(o.href);
          // Le crédit : la somme seule, à la place de « Mon crédit » (Elena,
          // 16 octobre) ; « Mon crédit » tant que le solde n'est pas chargé.
          const somme = o.href === "/credit" ? solde : null;
          return (
            <a
              key={o.href}
              href={o.href}
              aria-current={actif ? "page" : undefined}
              aria-label={somme ? `Mon crédit : ${somme}` : undefined}
              className={`flex min-h-[40px] items-center gap-3 rounded-2xl px-3 text-[14.5px] transition ${
                actif ? "bg-aubergine font-semibold text-cream" : "font-medium text-aubergine hover:bg-white/70"
              }`}
            >
              <Icone nom={o.icone} taille={17} className={actif ? "text-gold-light" : "text-gold-dark"} />
              {somme ? (
                <span className="flex-1 text-[16px] font-bold tabular-nums">{somme}</span>
              ) : (
                <span className="flex-1">{o.label}</span>
              )}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/** Téléphone : un point de statut sur l'onglet d'accueil, rien de plus */
function PastilleTelephone() {
  const e = etatElena(useElenaPresence());
  return <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-ivory ${e.badge}`} />;
}

/** Téléphone : le bouton d'appel, en haut de chaque écran */
function AppelTelephone() {
  const e = etatElena(useElenaPresence());
  return (
    <a
      href={e.enLigne ? "/dashboard" : RENDEZ_VOUS}
      className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-bold shadow-card ${e.enLigne ? "bg-statut-online text-white" : "bg-aubergine text-cream"}`}
    >
      <span className="relative inline-flex h-2.5 w-2.5">
        {e.enLigne && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${e.enLigne ? "bg-white" : e.badge}`} />
      </span>
      {e.enLigne ? "Appeler Elena" : "Rendez-vous"}
    </a>
  );
}

export default function EspaceShell({ prenom, signe, ascendant, children }: Props) {
  const pathname = usePathname() ?? "";
  const [prenomLocal, setPrenomLocal] = useState("");
  // Le solde, en une ligne au-dessus du menu : « Mon crédit · 5 € » (Elena, 14 octobre).
  const [soldeEuros, setSoldeEuros] = useState<number | null>(null);
  const [plusOuvert, setPlusOuvert] = useState(false);
  // L'emblème choisi dans Mon profil (migration 019), à la place de l'initiale
  const [embleme, setEmbleme] = useState<string | null>(null);

  useEffect(() => {
    const lire = () => setEmbleme(emblemeLocal());
    lire();
    window.addEventListener("embleme", lire);
    // Sur un nouvel appareil, rien dans le navigateur : on le demande une fois
    try {
      if (!emblemeLocal() && localStorage.getItem("token") && !sessionStorage.getItem("embleme-lu")) {
        sessionStorage.setItem("embleme-lu", "1");
        api.getProfil().then((d: { embleme?: string | null }) => { if (d?.embleme) memoriserEmbleme(d.embleme); }).catch(() => {});
      }
    } catch { /* stockage indisponible : l'initiale reste */ }
    return () => window.removeEventListener("embleme", lire);
  }, []);

  // L'espace cliente est réservé aux CLIENTES : le compte praticienne y
  // est redirigé vers son cabinet. Le vécu a montré le danger — connectée
  // ici, modifier "son" numéro écrase celui de la ligne professionnelle.
  useEffect(() => {
    if (typeof window === "undefined" || !localStorage.getItem("token")) return;
    api.getWallet().then((w: { balance?: number | string } | null) => {
      const b = w?.balance; if (b !== undefined && b !== null) setSoldeEuros(Number(b));
    }).catch(() => {});
  }, []);

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
    memoriserEmbleme(null);
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

        {GROUPES_ESPACE.filter((g) => g.appel).map((g) => (
          <BlocAppel key="appel" onglets={g.onglets} estActif={estActif} soldeEuros={soldeEuros} />
        ))}

        <nav aria-label="Espace cliente" className="flex flex-col">
          {GROUPES_ESPACE.filter((g) => !g.appel).map((g, gi) => (
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
            {embleme ? (
              <Embleme cle={embleme} taille={34} />
            ) : (
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-aubergine text-sm font-semibold text-cream">
                {initiale}
              </span>
            )}
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
          <div className="flex items-center gap-2">
            <AppelTelephone />
            <a
              href="/compte"
              aria-label="Paramètres"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-aubergine text-sm font-semibold text-cream"
            >
              {embleme ? <Embleme cle={embleme} taille={36} /> : initiale}
            </a>
          </div>
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
                {o.href === "/dashboard" && <PastilleTelephone />}
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
