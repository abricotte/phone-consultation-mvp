"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { capitaliser } from "@/lib/format";
import { signeAstrologique, signeParCode, type Signe } from "@/lib/astro";
import { useElenaPresence } from "@/components/useElenaStatus";
import EspaceShell from "@/components/EspaceShell";
import CarteElena from "@/components/CarteElena";
import TuileCredit from "@/components/TuileCredit";
import TuilePermanences, { permanencesVisibles } from "@/components/TuilePermanences";
import TuileAborder from "@/components/TuileAborder";

// MON ESPACE — l'accueil, « Le Salon » (maquette validée par Elena le
// 10 octobre 2026). Un tableau de bord doux : tout l'essentiel tient
// sans défiler, en tuiles, et chaque tuile répond à une question que la
// cliente se pose en arrivant :
//
//   A · Carte d'Elena       « Puis-je l'appeler maintenant ? »
//   B · Mon crédit          « Combien me reste-t-il ? »
//   C · Permanences         « Quand revient-elle ? »
//   D · Ce que je veux aborder   « Qu'est-ce que je veux lui dire ? »
//
// Rien d'autre — décisions d'Elena : pas de recharge ici (« l'accueil
// décide, Mon crédit exécute »), pas d'historique (il vit dans
// Consultations), pas de « dernière consultation il y a X jours » —
// c'est un compteur qui juge, une injonction déguisée.

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Wallet {
  balance: number;
}

// Pensée du jour — une par jour, en douceur (rotation déterministe)
const PENSEES = [
  "Rien ne meurt, tout se transforme.",
  "Ce qui est écrit trouve toujours son chemin.",
  "Écoutez votre intuition : elle parle avant les mots.",
  "Chaque rencontre laisse une empreinte dans votre ciel.",
  "La patience est une forme de confiance en l'avenir.",
  "Les réponses viennent à celles qui savent attendre.",
  "Votre lumière ne demande qu'à être vue.",
];

function jourDeLAnnee(d: Date): number {
  const debut = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - debut.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [prixMinuteCents, setPrixMinuteCents] = useState(290);
  const [minimumMinutes, setMinimumMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  // Calculés après montage (pas de décalage d'hydratation)
  const [dateDuJour, setDateDuJour] = useState("");
  const [pensee, setPensee] = useState("");
  const [signe, setSigne] = useState<Signe | null>(null);
  const [ascendant, setAscendant] = useState<Signe | null>(null);
  const [aAborder, setAAborder] = useState("");
  const [motElena, setMotElena] = useState<{ texte: string; quand: string | null } | null>(null);

  // La présence d'Elena, lue UNE fois ici et partagée aux tuiles : un
  // seul polling pour toute la page, et la grille sait d'avance si la
  // tuile des permanences a quelque chose à dire.
  const presence = useElenaPresence();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const maintenant = new Date();
    setDateDuJour(
      maintenant.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    );
    setPensee(PENSEES[jourDeLAnnee(maintenant) % PENSEES.length]);

    // Vérifier le retour de Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentStatus("Paiement effectué avec succès ! Votre solde sera mis à jour sous peu.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("payment") === "cancel") {
      setPaymentStatus("Paiement annulé.");
      window.history.replaceState({}, "", "/dashboard");
    }

    // Le mot d'Elena — s'il y en a un, il remplace la citation du jour.
    api
      .getMotElena()
      .then((r: { mot: { texte: string; quand: string | null } | null }) => setMotElena(r.mot))
      .catch(() => setMotElena(null));

    // Son ciel (pour la pastille du menu) et ce qu'elle veut aborder
    api
      .getProfil()
      .then(
        (p: { dateNaissance: string | null; ascendant: string | null; aAborder?: string }) => {
          setSigne(signeAstrologique(p.dateNaissance));
          setAscendant(signeParCode(p.ascendant));
          setAAborder(p.aAborder || "");
        }
      )
      .catch(() => {});

    api
      .getRechargeConfig()
      .then((c: { prixMinuteCents: number; creditMinimumMinutes: number }) => {
        if (c?.prixMinuteCents) setPrixMinuteCents(c.prixMinuteCents);
        if (c?.creditMinimumMinutes) setMinimumMinutes(c.creditMinimumMinutes);
      })
      .catch(() => {
        /* les valeurs par défaut restent affichées */
      });

    Promise.all([api.getMe(), api.getWallet()])
      .then(([userData, walletData]) => {
        // Espace réservé aux clientes : la praticienne va dans son cabinet
        if (userData.role === "consultant" || userData.role === "admin") {
          window.location.replace("/cabinet-ew");
          return;
        }
        setUser(userData);
        setWallet(walletData);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const balance = Number(wallet?.balance ?? 0);
  const minutesRestantes = Math.floor((balance * 100) / prixMinuteCents);
  const permVisibles = permanencesVisibles(presence);

  if (loading)
    return (
      <EspaceShell>
        <p className="mt-16 text-center text-mention">Chargement…</p>
      </EspaceShell>
    );
  if (error && !user)
    return (
      <EspaceShell>
        <p className="mt-16 text-center text-red-600">{error}</p>
      </EspaceShell>
    );

  return (
    <EspaceShell prenom={user?.firstName} signe={signe?.nom} ascendant={ascendant?.nom}>
      {/* ── En-tête ── le signe n'y est plus : il a migré dans la
          pastille du menu. Sur téléphone il reste dans Profil. */}
      <header className="mb-7">
        {dateDuJour && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {dateDuJour}
          </p>
        )}
        <h1 className="mt-1.5 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Bonjour {capitaliser(user?.firstName)}
        </h1>
        {/* LE MOT D'ELENA — quand elle en a posé un, il remplace la citation.
            Un mot écrit par elle, pour toutes, qu'elle change quand elle
            veut : c'est ce qui fait vivre l'espace même quand elle est
            hors ligne. Sans mot, la citation du jour reprend sa place —
            il n'y a jamais d'état vide. */}
        {motElena ? (
          <div className="relative mt-4 max-w-xl rounded-2xl border border-gold/40 bg-gradient-to-br from-gold/10 to-cream px-5 pb-4 pt-5">
            <span
              aria-hidden
              className="absolute -top-3 left-5 rounded-full bg-cream px-2 text-base text-gold"
            >
              ✦
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-gold-dark">
              Le mot d&apos;Elena
            </p>
            <p className="mt-1.5 font-serif text-lg italic leading-relaxed text-aubergine">
              « {motElena.texte} »
            </p>
            {motElena.quand && (
              <p className="mt-1.5 text-[11.5px] text-gold-dark/70">{motElena.quand}</p>
            )}
          </div>
        ) : (
          pensee && (
            <p className="mt-2 font-serif text-[19px] italic text-mention">« {pensee} »</p>
          )
        )}
      </header>

      {paymentStatus && (
        <div
          className={`mb-6 rounded-2xl p-4 ${
            paymentStatus.includes("succès")
              ? "bg-green-50 text-green-700"
              : "bg-yellow-50 text-yellow-700"
          }`}
        >
          {paymentStatus}
        </div>
      )}

      {error && <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-600">{error}</div>}

      {/* ── La grille ── bureau : 3 colonnes, A et C sur deux.
          Téléphone : une colonne, A → B → C → D. Quand la tuile des
          permanences n'a rien à dire, D prend toute la largeur — pas de
          trou. */}
      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <CarteElena
            soldeMinutes={minutesRestantes}
            minimumMinutes={minimumMinutes}
            prixMinuteCents={prixMinuteCents}
            presence={presence}
          />
        </div>

        <TuileCredit soldeEuros={balance} soldeMinutes={minutesRestantes} />

        {permVisibles && (
          <div className="md:col-span-2">
            <TuilePermanences presence={presence} />
          </div>
        )}

        <div className={permVisibles ? "" : "md:col-span-3"}>
          <TuileAborder texte={aAborder} />
        </div>
      </div>
    </EspaceShell>
  );
}
