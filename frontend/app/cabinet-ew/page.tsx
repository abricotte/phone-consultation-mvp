"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
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


  async function recharger() {
    const [s, j] = await Promise.all([api.adminGetStatut(), api.adminGetJour()]);
    setStatut(s);
    setJour(j);
  }

  useEffect(() => {
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
        </div>
      </div>
    );

  // 404 générique, identique aux autres pages inexistantes du site
  if (accesRefuse || (error && !statut)) notFound();

  const enConsultation = statut?.statut === "en_consultation";
  const disponible = statut?.statut === "disponible";

  return (
    <CabinetShell>
      <CabinetNav />

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

      <RendezVousDuJour />

      {/* 3. LES CHIFFRES DU JOUR — les quatre vignettes, qu'Elena tient
             à garder : « on voit tout d'un coup ». Elles racontent ce qui
             est FAIT ; ce qui VIENT est au-dessus, dans « Ma journée ». */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            valeur: `${jour?.consultationsAbouties ?? 0}`,
            label: "consultation" + ((jour?.consultationsAbouties ?? 0) > 1 ? "s" : "") + " aboutie" + ((jour?.consultationsAbouties ?? 0) > 1 ? "s" : ""),
            accent: true,
          },
          {
            valeur: `${jour?.tentativesSansReponse ?? 0}`,
            label:
              "tentative" +
              ((jour?.tentativesSansReponse ?? 0) > 1 ? "s" : "") +
              " sans réponse",
            accent: false,
          },
          {
            valeur: `${jour?.dureeTotaleMinutes ?? 0} min`,
            label: "d'écoute",
            accent: false,
          },
          {
            valeur: euros(jour?.revenusJour ?? 0),
            label: "encaissés",
            accent: true,
          },
        ].map((carte) => (
          <div
            key={carte.label}
            className="rounded-2xl border border-greige/60 bg-ivory px-4 py-3.5 text-center"
          >
            <p
              className={`text-2xl font-bold tabular-nums tracking-tight sm:text-3xl ${
                carte.accent ? "text-prix" : "text-mention"
              }`}
            >
              {carte.valeur}
            </p>
            <p className="mt-0.5 text-xs leading-tight text-mention">
              {carte.label}
            </p>
          </div>
        ))}
      </div>

      {jour && jour.appelsActifs > 0 && (
        <p className="mt-3 text-sm font-medium text-green-700">
          📞 {jour.appelsActifs} appel{jour.appelsActifs > 1 ? "s" : ""} en cours
        </p>
      )}

      {/* Dernier appel — le geste le plus fréquent après une consultation
          est d'ouvrir la fiche de celle qu'on vient de quitter. */}
      {jour?.dernierAppel && (
        <p className="mt-2 text-xs text-mention">
          Dernier appel :{" "}
          <span className="font-semibold text-ink">
            {jour.dernierAppel.prenom}
          </span>
          , {heureCourte(jour.dernierAppel.fini)}, {jour.dernierAppel.minutes} min
          {jour.dernierAppel.clienteId && (
            <>
              {" · "}
              <a
                href={`/cabinet-ew/clientes/${jour.dernierAppel.clienteId}`}
                className="text-prix hover:underline"
              >
                voir sa fiche
              </a>
            </>
          )}
        </p>
      )}

      <p className="mt-2 text-xs text-mention">
        {/* Cet argent est encaissé mais dû en prestation : il compte pour
            la TVA et la trésorerie, pas comme un revenu acquis. */}
        <span
          className="cursor-help border-b border-dotted border-mention/50"
          title="Déjà encaissé, à honorer en consultations. Cet argent est sur votre compte mais vous le devez encore en prestations."
        >
          Crédit détenu par vos clientes
        </span>{" "}
        :{" "}
        <span className="font-semibold text-ink">
          {euros(jour?.soldesClientsTotal ?? 0)}
        </span>{" "}
        ({jour?.nombreWallets ?? 0} portefeuille
        {(jour?.nombreWallets ?? 0) > 1 ? "s" : ""}) ·{" "}
        <a href="/cabinet-ew/journal" className="text-prix hover:underline">
          voir le journal →
        </a>
      </p>

      {/* La consultation minutee a rejoint l'onglet Calendly (decision
          d'Elena) : c'est un geste Calendly par nature, il vit a cote de
          la liste des rendez-vous. */}

      {/* 5. Ligne téléphonique — discrète, en pied */}
      <SanteLigne variante="pied" />
    </CabinetShell>
  );
}
