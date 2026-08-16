"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { capitaliser } from "@/lib/format";
import { signeAstrologique, signeParCode, type Signe } from "@/lib/astro";
import HeroConsultation from "@/components/HeroConsultation";
import EspaceNav from "@/components/EspaceNav";

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
  const [suggestionsMinutes, setSuggestionsMinutes] = useState<number[]>([10, 20, 30]);
  const [minMinutes, setMinMinutes] = useState(5);
  const [maxMinutes, setMaxMinutes] = useState(90);
  const [pasMinutes, setPasMinutes] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  // Calculés après montage (pas de décalage d'hydratation)
  const [dateDuJour, setDateDuJour] = useState("");
  const [pensee, setPensee] = useState("");
  const [signe, setSigne] = useState<Signe | null>(null);
  const [ascendant, setAscendant] = useState<Signe | null>(null);
  const [motElena, setMotElena] = useState<{ texte: string; quand: string | null } | null>(null);

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

    // Signe et ascendant à côté du bonjour : l'espace la reconnaît.
    api
      .getProfil()
      .then((p: { dateNaissance: string | null; ascendant: string | null }) => {
        setSigne(signeAstrologique(p.dateNaissance));
        setAscendant(signeParCode(p.ascendant));
      })
      .catch(() => {});

    api
      .getRechargeConfig()
      .then(
        (c: {
          prixMinuteCents: number;
          creditMinimumMinutes: number;
          suggestionsMinutes: number[];
          minMinutes: number;
          maxMinutes: number;
          pasMinutes: number;
        }) => {
          if (c?.prixMinuteCents) setPrixMinuteCents(c.prixMinuteCents);
          if (c?.creditMinimumMinutes) setMinimumMinutes(c.creditMinimumMinutes);
          if (c?.suggestionsMinutes?.length) setSuggestionsMinutes(c.suggestionsMinutes);
          if (c?.minMinutes) setMinMinutes(c.minMinutes);
          if (c?.maxMinutes) setMaxMinutes(c.maxMinutes);
          if (c?.pasMinutes) setPasMinutes(c.pasMinutes);
        }
      )
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

  const balance = wallet?.balance ?? 0;
  const minutesRestantes = Math.floor((balance * 100) / prixMinuteCents);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (error && !user)
    return <div className="mt-16 text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 font-jakarta">
      <EspaceNav />

      {/* Salutation */}
      <header className="relative mt-10 mb-8">
        <span aria-hidden className="pointer-events-none absolute right-2 top-0 text-lg text-gold/50">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-14 top-8 text-[0.6rem] text-coral/40">✦</span>

        {dateDuJour && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {dateDuJour}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
          <h1 className="font-serif text-4xl font-semibold text-aubergine sm:text-5xl">
            Bonjour {capitaliser(user?.firstName)}
          </h1>
          {/* Son ciel à côté de son prénom : l'espace la reconnaît. */}
          {signe && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blush px-3 py-1 text-sm text-aubergine">
              <span aria-hidden>{signe.emoji}</span>
              {signe.nom}
              {ascendant && (
                <span className="text-mention">· asc. {ascendant.nom}</span>
              )}
            </span>
          )}
        </div>
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
            <p className="mt-2 font-serif text-lg italic text-mention/90">
              « {pensee} »
            </p>
          )
        )}
      </header>

      {paymentStatus && (
        <div className={`mb-6 rounded-2xl p-4 ${paymentStatus.includes("succès") ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {paymentStatus}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 p-4 text-red-600">
          {error}
        </div>
      )}

      {/* LE geste direct : appeler / recharger (tout centralisé ici) */}
      <div className="mb-6">
        <HeroConsultation
          soldeMinutes={minutesRestantes}
          minimumMinutes={minimumMinutes}
          prixMinuteCents={prixMinuteCents}
          suggestionsMinutes={suggestionsMinutes}
          minMinutes={minMinutes}
          maxMinutes={maxMinutes}
          pasMinutes={pasMinutes}
        />
      </div>

      {/* Rien sous les deux portes — decision d'Elena (15 aout 2026).
          Le chemin a rejoint l'onglet Consultations. Et « Votre derniere
          consultation : il y a 5 jours » a ete retire aussi : c'est un
          compteur qui juge, une injonction deguisee. Une cliente qui
          revient apres un mois ne doit rien lire qui ressemble a un
          reproche. L'accueil decide, il ne compte pas. */}
    </div>
  );
}
