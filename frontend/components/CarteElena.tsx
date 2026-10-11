"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  heureRetour,
  heureFr,
  jourRelatif,
  type ElenaPresence,
  type ElenaStatus,
} from "@/components/useElenaStatus";
import { Icone } from "@/components/IconesEspace";

// LA CARTE D'ELENA — la tuile A de l'accueil. Elle répond à la première
// question de la cliente : « Puis-je l'appeler maintenant ? »
//
// C'est l'ancien HeroConsultation réorganisé, SANS changer sa logique :
// même machine à états, mêmes portes, mêmes destinations. Ce qui change
// est la mise en page — une ligne de statut (visage + titre + sous-titre)
// au lieu d'une bannière, et plus de ligne de crédit : la tuile « Mon
// crédit » la porte désormais.
//
// Le ton reste une INVITATION, jamais une pression : pas de compte à
// rebours, pas d'urgence fabriquée. « Elle est là » suffit.

interface Props {
  soldeMinutes: number;
  minimumMinutes: number;
  prixMinuteCents: number;
  /** La présence d'Elena — lue une fois par l'accueil, partagée aux tuiles */
  presence: ElenaPresence;
  /** Aperçu/tests uniquement : force le statut */
  statutDemo?: ElenaStatus;
}

const CALENDLY = "https://elena-wolska.com/disponibilites";

/** « 14,50 € » — le prix d'un nombre de minutes au tarif courant */
function prixDe(minutes: number, cents: number): string {
  const t = minutes * cents;
  return t % 100 === 0
    ? `${t / 100} €`
    : `${(t / 100).toFixed(2).replace(".", ",")} €`;
}

/**
 * Le visage d'Elena, avec l'état en badge dans le coin — comme une
 * messagerie. La couleur continue de dire l'état ; le visage dit QUI :
 * c'est elle qui est là, pas un point vert. Le pouls (ping) est réservé
 * aux états où quelque chose est en train de se passer.
 */
function AvatarStatut({ couleur, pouls = false }: { couleur: string; pouls?: boolean }) {
  return (
    <span className="relative inline-flex shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/elena-avatar.png"
        alt=""
        width={64}
        height={64}
        className="h-16 w-16 rounded-full object-cover ring-[3px] ring-white shadow-soft"
      />
      <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px]">
        {pouls && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${couleur}`}
          />
        )}
        <span className={`relative inline-flex h-[18px] w-[18px] rounded-full ring-2 ring-white ${couleur}`} />
      </span>
    </span>
  );
}

interface LigneStatut {
  badge: string;
  pouls?: boolean;
  titre: string;
  titreClasse: string;
  sousTitre?: string | null;
  italique?: boolean;
}

export default function CarteElena({
  soldeMinutes,
  minimumMinutes,
  prixMinuteCents,
  presence,
  statutDemo,
}: Props) {
  const statut = statutDemo ?? presence.statut;
  // « De retour vers 15h03 » — porte qui dit quand elle rouvre
  const retour =
    presence.retourPrevu && heureRetour(presence.retourPrevu)
      ? heureFr(presence.retourPrevu)
      : null;

  const [appelEnCours, setAppelEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const enLigne = statut === "disponible";
  const creditSuffisant = soldeMinutes >= minimumMinutes;

  // Une permanence AUJOURD'HUI change tout le ton de l'écran : ce n'est
  // plus une porte close, c'est une promesse — « Elena sera en ligne de
  // 17h45 à 19h ». Et si le crédit manque, la porte pleine mène à la
  // recharge avec cette promesse pour raison : « vous serez prête ».
  const prochaine = presence.permanence.prochaine;
  const enCoursPerm = presence.permanence.enCours;
  const permanenceAujourdhui =
    !!prochaine &&
    statut === "hors_ligne" &&
    !presence.messageAbsence &&
    new Date(prochaine.debut).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" }) ===
      new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

  // ── La ligne de statut : un seul objet par état, la mise en page est
  // commune. Hors ligne, les écriteaux par priorité : absence >
  // permanence en cours (« Elena arrive ») > permanence aujourd'hui >
  // prochaine permanence > semaine sans permanence > heures habituelles.
  // « Le calendrier annonce, le bouton fait foi » : rien ici n'ouvre un
  // appel, tout dit seulement quand revenir.
  let ligne: LigneStatut;
  if (statut === "chargement") {
    ligne = { badge: "bg-greige", titre: "Vérification…", titreClasse: "text-mention" };
  } else if (statut === "disponible") {
    ligne = {
      badge: "bg-statut-online",
      pouls: true,
      titre: "Elena est en ligne",
      titreClasse: "text-statut-online",
      sousTitre: "vous pouvez l'appeler maintenant",
    };
  } else if (statut === "en_consultation") {
    ligne = {
      badge: "bg-amber-500",
      titre: "Elena est en consultation",
      titreClasse: "text-amber-700",
      sousTitre: retour ? `de retour vers ${retour}` : null,
    };
  } else if (presence.messageAbsence) {
    ligne = {
      badge: "bg-statut-offline",
      titre: "Elena n'est pas en ligne",
      titreClasse: "text-mention",
      sousTitre: presence.messageAbsence,
      italique: true,
    };
  } else if (enCoursPerm) {
    // Bascule éteinte pendant un créneau : le retard devient bénin.
    ligne = {
      badge: "bg-gold",
      pouls: true,
      titre: "Permanence en cours — Elena arrive",
      titreClasse: "text-gold-dark",
      sousTitre: `Prévue de ${heureFr(enCoursPerm.debut)} à ${heureFr(enCoursPerm.fin)} · restez à proximité`,
    };
  } else if (permanenceAujourdhui && prochaine) {
    // Une permanence AUJOURD'HUI : on l'annonce en positif — « sera en
    // ligne » — pas en creux — « n'est pas en ligne ».
    ligne = {
      badge: "bg-gold",
      titre: `Elena sera en ligne aujourd'hui, de ${heureFr(prochaine.debut)} à ${heureFr(prochaine.fin)}`,
      titreClasse: "text-aubergine",
      sousTitre: "le bouton d'appel apparaîtra à cette heure",
    };
  } else if (prochaine) {
    ligne = {
      badge: "bg-statut-offline",
      titre: `Prochaine permanence : ${jourRelatif(prochaine.debut)} ${heureFr(prochaine.debut)}`,
      titreClasse: "text-aubergine",
      sousTitre: "à la minute pendant la permanence — ou réservez un créneau",
    };
  } else if (presence.permanence.actives) {
    ligne = {
      badge: "bg-statut-offline",
      titre: "Pas de permanence cette semaine",
      titreClasse: "text-mention",
      sousTitre: "les consultations se font sur rendez-vous",
    };
  } else {
    ligne = {
      badge: "bg-statut-offline",
      titre: "Elena n'est pas en ligne",
      titreClasse: "text-mention",
      sousTitre: presence.heuresIndicatives,
      italique: true,
    };
  }

  async function handleAppel() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setAppelEnCours(true);
    setMessage("");
    setErreur("");
    try {
      const session = await api.createSession();
      setMessage("Session créée, lancement de l'appel…");
      const call = await api.initiateCall(session.id);
      setMessage(
        `C'est parti ! Votre téléphone va sonner${
          call.maxMinutes ? ` — jusqu'à ${call.maxMinutes} min avec votre crédit` : ""
        }.`
      );
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur lors de l'appel");
    } finally {
      setAppelEnCours(false);
    }
  }

  // Porte 2 en contour quand la porte 1 est un vrai bouton plein ;
  // pleine quand la porte 1 n'est qu'un constat — règle inchangée.
  // Deux boutons pleins côte à côte se disputent l'œil (vu sur l'écran
  // de Rue, 11 octobre) : dès que la porte 1 est un vrai bouton — appel
  // ou recharge — la porte 2 passe en contour.
  const porte1Pleine = enLigne || (permanenceAujourdhui && !creditSuffisant);

  const classePleine =
    "block w-full rounded-2xl bg-cta px-6 py-[18px] text-center shadow-card transition hover:bg-cta-dark";
  const classeConstat = "w-full rounded-2xl px-6 py-[18px] text-center";

  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-greige bg-ivory p-5 shadow-soft md:p-7">
      {/* ── Ligne de statut ── */}
      <div className="flex items-center gap-4">
        <AvatarStatut couleur={ligne.badge} pouls={!!ligne.pouls} />
        <div className="min-w-0">
          <p className={`text-xl font-bold leading-tight md:text-2xl ${ligne.titreClasse}`}>
            {ligne.titre}
          </p>
          {ligne.sousTitre && (
            <p className={`mt-1 text-sm text-mention ${ligne.italique ? "italic" : ""}`}>
              {ligne.sousTitre}
            </p>
          )}
        </div>
      </div>

      {/* ── DEUX PORTES — le cœur de l'espace, dessiné par Elena.
          « L'accueil décide, Mon crédit exécute » : ici, AUCUNE recharge.
          Le bouton d'appel dit toujours la même chose mais mène soit à
          l'appel, soit à la recharge, selon ce qui est nécessaire : la
          cliente ne choisit jamais entre « appeler » et « recharger »,
          le système sait. Et quand l'appel est impossible, le LIBELLÉ
          change — proposer une action impossible frustre plus que de ne
          rien proposer. */}
      <div className="mt-5 space-y-3">
        {enLigne && creditSuffisant ? (
          <button
            onClick={handleAppel}
            disabled={appelEnCours}
            className={`${classePleine} disabled:opacity-50`}
          >
            <span className="flex items-center justify-center gap-2 text-[19px] font-semibold text-cta-text">
              <Icone nom="appeler" taille={20} />
              {appelEnCours ? "Connexion…" : "Appeler maintenant"}
            </span>
            <span className="block text-xs text-cta-text/80">
              à la minute · {prixDe(1, prixMinuteCents)}/min · votre téléphone sonne
            </span>
          </button>
        ) : enLigne ? (
          // Même libellé, autre destination : la recharge, avec la raison.
          <a href="/credit?pour=appeler" className={classePleine}>
            <span className="flex items-center justify-center gap-2 text-[19px] font-semibold text-cta-text">
              <Icone nom="appeler" taille={20} />
              Appeler maintenant
            </span>
            <span className="block text-xs text-cta-text/80">
              il vous reste {soldeMinutes} min — rechargez pour appeler
            </span>
          </a>
        ) : permanenceAujourdhui && prochaine && !creditSuffisant ? (
          // Elle pourra appeler dans quelques heures et n'a pas le crédit :
          // la porte pleine mène à la recharge, avec la promesse pour raison
          // — et le minimum, pour qu'elle comprenne AVANT de cliquer.
          <a href="/credit?pour=appeler" className={classePleine}>
            <span className="block text-[19px] font-semibold text-cta-text">
              Préparer mon crédit pour l&apos;appeler
            </span>
            <span className="block text-xs text-cta-text/80">
              il faut au moins {minimumMinutes} min ({prixDe(minimumMinutes, prixMinuteCents)}) —
              vous serez prête à {heureFr(prochaine.debut)}
            </span>
          </a>
        ) : permanenceAujourdhui && prochaine ? (
          // Crédit suffisant, permanence à venir : elle est prête, on le dit.
          <div className={`${classeConstat} border border-gold/40 bg-gold/5`}>
            <span className="block text-[19px] font-semibold text-gold-dark">
              Vous êtes prête pour {heureFr(prochaine.debut)}
            </span>
            <span className="block text-xs text-mention">
              revenez à cette heure — le bouton d&apos;appel apparaîtra
            </span>
          </div>
        ) : (
          // Appel impossible : simple constat, pas un bouton.
          <div className={`${classeConstat} border border-greige/70 bg-cream/50`}>
            <span className="block text-[19px] font-semibold text-aubergine/70">
              {statut === "en_consultation"
                ? "Appeler dès qu'Elena se libère"
                : "Appeler pendant la permanence"}
            </span>
            <span className="block text-xs text-mention">
              {statut === "en_consultation" && retour
                ? `de retour vers ${retour}`
                : prochaine
                  ? `prochaine : ${jourRelatif(prochaine.debut)} ${heureFr(prochaine.debut)} – ${heureFr(prochaine.fin)}`
                  : "à la minute, quand Elena est en ligne"}
            </span>
          </div>
        )}

        <a
          href={CALENDLY}
          className={`block w-full rounded-2xl px-6 py-4 text-center transition ${
            porte1Pleine
              ? "border border-greige bg-white text-aubergine hover:border-cta/50"
              : "bg-cta text-cta-text shadow-card hover:bg-cta-dark"
          }`}
        >
          <span className="flex items-center justify-center gap-2 text-[17px] font-semibold">
            <Icone nom="reserver" taille={18} />
            Réserver un créneau
          </span>
          <span className={`block text-xs ${porte1Pleine ? "text-mention" : "text-cta-text/80"}`}>
            Découverte 20 min · Complète 45 min
          </span>
        </a>
      </div>

      {message && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
          {message}
        </p>
      )}
      {erreur && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{erreur}</p>
      )}
    </section>
  );
}
