"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetShell from "@/components/CabinetShell";
import BandeauAppelEnCours, {
  type AppelEnCours,
} from "@/components/BandeauAppelEnCours";
import SanteLigne from "@/components/SanteLigne";
import RendezVousDuJour from "@/components/RendezVousDuJour";
import RappelPermanence from "@/components/RappelPermanence";
import RechercheCliente from "@/components/RechercheCliente";

interface Forfait {
  code: string;
  nom: string;
  minutes: number;
  prix: number;
}

interface Statut {
  statut: "hors_ligne" | "disponible" | "en_consultation";
  enLigne: boolean;
  enLigneDepuis: string | null;
  retourPrevu: string | null;
  autoOffHeures: number;
  forfaits: Forfait[];
  appelEnCours: AppelEnCours | null;
}

interface Jour {
  appelsDuJour: number;
  appelsTermines: number;
  consultationsAbouties: number;
  tentativesSansReponse: number;
  appelsActifs: number;
  forfaitsManuels: number;
  dureeTotaleMinutes: number;
  revenusJour: number;
  soldesClientsTotal: number;
  nombreWallets: number;
  dernierAppel: {
    clienteId: string | null;
    prenom: string;
    fini: string;
    minutes: number;
  } | null;
}

function heureCourte(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

function euros(n: number) {
  return n % 1 === 0 ? `${n} €` : `${n.toFixed(2).replace(".", ",")} €`;
}

function heure(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPage() {
  const [statut, setStatut] = useState<Statut | null>(null);
  const [jour, setJour] = useState<Jour | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");
  const [accesRefuse, setAccesRefuse] = useState(false);

  // Porte d'entrée dédiée : sans jeton, on affiche un formulaire de
  // connexion sur place (la praticienne ne passe plus par le login public)
  const [nonConnectee, setNonConnectee] = useState(false);
  const [lEmail, setLEmail] = useState("");
  const [lMdp, setLMdp] = useState("");
  const [lErreur, setLErreur] = useState("");
  const [lEnCours, setLEnCours] = useState(false);
  // Mot de passe oublié — par appel : son téléphone dicte un code
  const [oubli, setOubli] = useState<"ferme" | "demande" | "code">("ferme");
  const [oCode, setOCode] = useState("");
  const [oMdp, setOMdp] = useState("");
  const [oMdp2, setOMdp2] = useState("");
  const [oMessage, setOMessage] = useState("");
  const [dateDuJour, setDateDuJour] = useState("");


  async function recharger() {
    const [s, j] = await Promise.all([api.adminGetStatut(), api.adminGetJour()]);
    setStatut(s);
    setJour(j);
  }

  useEffect(() => {
    setDateDuJour(
      new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    );

    // Sans jeton → formulaire de connexion dédié (porte d'entrée de la
    // praticienne). Jeton présent mais mauvais rôle / erreur → 404
    // générique : l'existence de cet espace n'est confirmée à personne.
    const token = localStorage.getItem("token");
    if (!token) {
      setNonConnectee(true);
      setLoading(false);
      return;
    }

    recharger()
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));

    // Polling rapproché (10 s) : un appel entrant doit apparaître avant
    // même de décrocher (le téléphone sonne ~20-30 s).
    const id = setInterval(() => recharger().catch(() => {}), 10_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle() {
    if (!statut) return;
    setToggling(true);
    setError("");
    try {
      await api.adminSetStatut(statut.statut !== "disponible");
      await recharger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setToggling(false);
    }
  }

  async function demanderCode() {
    setLErreur("");
    setOMessage("");
    if (!lEmail) {
      setLErreur("Indiquez d'abord votre email, puis demandez le code.");
      return;
    }
    setLEnCours(true);
    try {
      const r = await api.cabinetMdpDemander(lEmail);
      setOMessage(r.message);
      setOubli("code");
    } catch (err) {
      setLErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLEnCours(false);
    }
  }

  async function confirmerNouveauMdp(e: React.FormEvent) {
    e.preventDefault();
    setLErreur("");
    if (oMdp !== oMdp2) {
      setLErreur("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setLEnCours(true);
    try {
      const data = await api.cabinetMdpConfirmer({
        email: lEmail,
        code: oCode,
        nouveauMotDePasse: oMdp,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.location.reload();
    } catch (err) {
      setLErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLEnCours(false);
    }
  }

  async function handleConnexionCabinet(e: React.FormEvent) {
    e.preventDefault();
    setLErreur("");
    setLEnCours(true);
    try {
      const data = await api.login({ email: lEmail, password: lMdp });
      const role = data.user?.role;
      if (role === "consultant" || role === "admin") {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.reload();
        return;
      }
      // Compte cliente : jeton NON conservé, et même message qu'un vrai
      // échec — cette porte ne confirme rien à qui n'est pas praticienne.
      setLErreur("Email ou mot de passe incorrect");
    } catch {
      setLErreur("Email ou mot de passe incorrect");
    } finally {
      setLEnCours(false);
    }
  }

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;

  // Porte d'entrée dédiée de la praticienne (déjà sur fond nuit)
  if (nonConnectee)
    return (
      <div className="min-h-screen bg-cream px-4 py-16 font-jakarta sm:px-5">
        <div className="mx-auto max-w-md rounded-2xl border border-greige/60 bg-ivory p-8 shadow-soft">
          <h1 className="font-jakarta text-2xl font-bold tracking-tight text-aubergine">
            Espace privé
          </h1>
          <p className="mt-1 text-sm text-mention">
            Réservé à la praticienne.
          </p>

          {lErreur && (
            <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {lErreur}
            </p>
          )}

          <form onSubmit={handleConnexionCabinet} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-aubergine">
                Email
              </label>
              <input
                type="email"
                value={lEmail}
                onChange={(e) => setLEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-aubergine">
                Mot de passe
              </label>
              <input
                type="password"
                value={lMdp}
                onChange={(e) => setLMdp(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
              />
            </div>
            <button
              type="submit"
              disabled={lEnCours}
              className="w-full rounded-full bg-cta py-3 font-medium text-cta-text hover:bg-cta-dark disabled:opacity-50"
            >
              {lEnCours ? "Connexion…" : "Entrer"}
            </button>
          </form>

          {/* MOT DE PASSE OUBLIÉ — par appel. Pas d'email sortant sur la
              plateforme : le téléphone de la praticienne sonne et dicte
              un code à 4 chiffres, qu'elle saisit ici avec son nouveau
              mot de passe. Qui tient ce téléphone peut le faire, personne
              d'autre. */}
          {oubli === "ferme" && (
            <button
              type="button"
              onClick={() => setOubli("demande")}
              className="mt-4 text-xs text-mention underline decoration-greige underline-offset-4 hover:text-aubergine"
            >
              Mot de passe oublié ?
            </button>
          )}

          {oubli === "demande" && (
            <div className="mt-5 rounded-2xl bg-blush px-4 py-4">
              <p className="text-sm font-semibold text-aubergine">Mot de passe oublié</p>
              <p className="mt-1 text-sm text-ink/80">
                Indiquez votre email ci-dessus : votre téléphone va sonner et
                vous dicter un code à 4 chiffres.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={demanderCode}
                  disabled={lEnCours}
                  className="rounded-full bg-aubergine px-5 py-2.5 text-sm font-semibold text-cream hover:bg-aubergine/90 disabled:opacity-50"
                >
                  {lEnCours ? "Appel…" : "M'appeler avec le code"}
                </button>
                <button
                  type="button"
                  onClick={() => setOubli("ferme")}
                  className="text-xs text-mention hover:text-aubergine"
                >
                  annuler
                </button>
              </div>
            </div>
          )}

          {oubli === "code" && (
            <form onSubmit={confirmerNouveauMdp} className="mt-5 space-y-3 rounded-2xl bg-blush px-4 py-4">
              <p className="text-sm font-semibold text-aubergine">Nouveau mot de passe</p>
              {oMessage && <p className="text-xs text-ink/80">{oMessage}</p>}
              <div>
                <label className="mb-1 block text-sm font-medium text-aubergine">
                  Code dicté au téléphone
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\\d{4}"
                  maxLength={4}
                  value={oCode}
                  onChange={(e) => setOCode(e.target.value.replace(/\\D/g, ""))}
                  required
                  className="w-32 rounded-lg border border-greige bg-white px-3 py-2.5 text-center text-lg tracking-[0.3em] text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-aubergine">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={oMdp}
                  onChange={(e) => setOMdp(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-aubergine">
                  Le même, une seconde fois
                </label>
                <input
                  type="password"
                  value={oMdp2}
                  onChange={(e) => setOMdp2(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={lEnCours}
                  className="rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-text hover:bg-cta-dark disabled:opacity-50"
                >
                  {lEnCours ? "Enregistrement…" : "Enregistrer et entrer"}
                </button>
                <button
                  type="button"
                  onClick={demanderCode}
                  disabled={lEnCours}
                  className="text-xs text-mention hover:text-aubergine"
                >
                  pas de code reçu ? rappeler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );

  // 404 générique, identique aux autres pages inexistantes du site
  if (accesRefuse || (error && !statut)) notFound();

  const enConsultation = statut?.statut === "en_consultation";
  const disponible = statut?.statut === "disponible";

  return (
    <CabinetShell>
      {/* Même en-tête que l'espace des clientes : la date, le bonjour.
          Le Salon est une seule maison, des deux côtés de la porte. */}
      <header>
        {dateDuJour && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
            {dateDuJour}
          </p>
        )}
        <h1 className="mt-1.5 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Bonjour Elena
        </h1>
      </header>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* 1. Consultation en cours — priorité absolue, tout en haut */}
      {statut?.appelEnCours && (
        <div className="mt-4">
          <BandeauAppelEnCours appel={statut.appelEnCours} />
        </div>
      )}

      {/* Alerte ligne : ne s'affiche QUE si le solde Twilio est bas */}
      <SanteLigne variante="alerte" />

      {/* 2. STATUT — l'action principale, compacte et accessible sans
             défilement, y compris sur téléphone */}
      <div className="mt-4 rounded-2xl border border-greige/70 bg-ivory p-5 shadow-soft">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {disponible && (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-statut-online">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-statut-online" />
                </span>
                VOUS ÊTES EN LIGNE
              </span>
            )}
            {enConsultation && (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-amber-700">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                EN CONSULTATION
              </span>
            )}
            {statut?.statut === "hors_ligne" && (
              <span className="inline-flex items-center gap-2 text-sm font-medium text-mention">
                <span className="h-2.5 w-2.5 rounded-full bg-statut-offline" />
                Vous êtes hors ligne
              </span>
            )}

            <p className="mt-1 text-xs text-mention">
              {disponible && statut?.enLigneDepuis
                ? `Depuis ${heure(statut.enLigneDepuis)} · hors ligne auto après ${statut.autoOffHeures} h`
                : enConsultation
                ? "Retour automatique à la fin de l'appel."
                : "Vos clientes ne peuvent pas vous appeler."}
            </p>
          </div>

          <button
            onClick={handleToggle}
            disabled={toggling || enConsultation}
            className={`w-full shrink-0 rounded-full px-8 py-4 text-base font-bold text-cta-text shadow-card transition disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
              disponible ? "bg-ink/70 hover:bg-ink" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {toggling
              ? "Mise à jour…"
              : disponible
              ? "Passer hors ligne"
              : "Passer en ligne"}
          </button>
        </div>
      </div>

      {/* 2 bis. MA JOURNÉE — juste sous le statut : le poste de pilotage,
             à la place de la boîte mail. Toujours visible — une journée
             libre se lit, elle ne se devine pas. */}
      {/* TROUVER UNE CLIENTE — sous le statut, avant tout le reste : c'est
             le geste qu'Elena fait pendant un appel. Elle tape, Entree,
             elle est sur la fiche. Il doit etre en haut, sans defiler. */}
      <RechercheCliente />

      {/* La permanence du jour, en tete des infos du jour : c'est
             l'engagement de la journee, elle se lit avec les rendez-vous. */}
      <RappelPermanence />

      {/* MA JOURNÉE (ce qui VIENT) à gauche, AUJOURD'HUI (ce qui est
          FAIT) à droite, dans la tuile sombre — validée par Elena le
          10 octobre. Les quatre chiffres y restent lisibles d'un coup :
          encaissé, consultations, écoute, tentatives. */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <RendezVousDuJour />
        </div>

        <section className="relative mt-4 flex flex-col overflow-hidden rounded-3xl bg-aubergine p-5 text-cream md:p-6">
          <span aria-hidden className="pointer-events-none absolute right-5 top-4 text-xl text-gold/60">
            ✦
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light">
            Aujourd&apos;hui
          </p>
          <p className="mt-3 font-serif text-[48px] font-semibold leading-none tabular-nums">
            {euros(jour?.revenusJour ?? 0)}
          </p>
          <p className="mt-1 text-[13px] text-cream/70">encaissés</p>

          <p className="mt-4 text-sm tabular-nums text-cream">
            {jour?.consultationsAbouties ?? 0} consultation
            {(jour?.consultationsAbouties ?? 0) > 1 ? "s" : ""} aboutie
            {(jour?.consultationsAbouties ?? 0) > 1 ? "s" : ""} ·{" "}
            {jour?.dureeTotaleMinutes ?? 0} min d&apos;écoute
          </p>
          <p className="mt-1 text-sm tabular-nums text-cream/70">
            {jour?.tentativesSansReponse ?? 0} tentative
            {(jour?.tentativesSansReponse ?? 0) > 1 ? "s" : ""} sans réponse
          </p>

          {jour && jour.appelsActifs > 0 && (
            <p className="mt-2 text-sm font-semibold text-gold-light">
              {jour.appelsActifs} appel{jour.appelsActifs > 1 ? "s" : ""} en cours
            </p>
          )}

          {/* Dernier appel — le geste le plus fréquent après une
              consultation est d'ouvrir la fiche de celle qu'on vient de
              quitter. */}
          {jour?.dernierAppel && (
            <p className="mt-4 text-xs text-cream/70">
              Dernier appel :{" "}
              <span className="font-semibold text-cream">{jour.dernierAppel.prenom}</span>,{" "}
              {heureCourte(jour.dernierAppel.fini)}, {jour.dernierAppel.minutes} min
              {jour.dernierAppel.clienteId && (
                <>
                  {" · "}
                  <a
                    href={`/cabinet-ew/clientes/${jour.dernierAppel.clienteId}`}
                    className="text-gold-light hover:underline"
                  >
                    voir sa fiche
                  </a>
                </>
              )}
            </p>
          )}

          <p className="mt-auto pt-4 text-xs text-cream/60">
            {/* Cet argent est encaissé mais dû en prestation : il compte pour
                la TVA et la trésorerie, pas comme un revenu acquis. */}
            <span
              className="cursor-help border-b border-dotted border-cream/40"
              title="Déjà encaissé, à honorer en consultations. Cet argent est sur votre compte mais vous le devez encore en prestations."
            >
              Crédit détenu
            </span>{" "}
            : <span className="font-semibold text-cream/90">{euros(jour?.soldesClientsTotal ?? 0)}</span>{" "}
            ({jour?.nombreWallets ?? 0} portefeuille
            {(jour?.nombreWallets ?? 0) > 1 ? "s" : ""}) ·{" "}
            <a href="/cabinet-ew/journal" className="text-gold-light hover:underline">
              journal →
            </a>
          </p>
        </section>
      </div>

      {/* La consultation minutee a rejoint l'onglet Calendly (decision
          d'Elena) : c'est un geste Calendly par nature, il vit a cote de
          la liste des rendez-vous. */}

      {/* 5. Ligne téléphonique — discrète, en pied */}
      <SanteLigne variante="pied" />
    </CabinetShell>
  );
}
