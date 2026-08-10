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
  appelsActifs: number;
  forfaitsManuels: number;
  dureeTotaleMinutes: number;
  revenusJour: number;
  soldesClientsTotal: number;
  nombreWallets: number;
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

  // Consultation minutée
  const [telephone, setTelephone] = useState("");
  const [forfaitCode, setForfaitCode] = useState("");
  const [lancement, setLancement] = useState(false);
  const [messageAppel, setMessageAppel] = useState("");

  async function recharger() {
    const [s, j] = await Promise.all([api.adminGetStatut(), api.adminGetJour()]);
    setStatut(s);
    setJour(j);
    if (!forfaitCode && s.forfaits?.length) setForfaitCode(s.forfaits[0].code);
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

  async function handleLancerConsultation(e: React.FormEvent) {
    e.preventDefault();
    setLancement(true);
    setError("");
    setMessageAppel("");
    try {
      const data = await api.adminLancerConsultation(telephone, forfaitCode);
      setMessageAppel(data.message);
      setTelephone("");
      await recharger();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur au lancement");
    } finally {
      setLancement(false);
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
          <h1 className="font-serif text-2xl font-semibold text-aubergine">
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

      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
        Espace praticienne
      </h1>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Consultation en cours — priorité absolue quand le téléphone sonne */}
      {statut?.appelEnCours && (
        <div className="mt-6">
          <BandeauAppelEnCours appel={statut.appelEnCours} />
        </div>
      )}

      {/* Santé de la ligne : une ligne à sec fait échouer les appels en
          silence — le voyant évite d'ouvrir avec un tuyau cassé */}
      <SanteLigne />

      {/* ===== Statut ===== */}
      <div className="mt-8 rounded-2xl border border-greige/70 bg-ivory p-8 text-center shadow-soft">
        <div className="mb-4 flex justify-center">
          {disponible && (
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-statut-online">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-statut-online opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-statut-online" />
              </span>
              Vous êtes EN LIGNE
            </span>
          )}
          {enConsultation && (
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-1.5 text-sm font-semibold text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              EN CONSULTATION
              {statut?.retourPrevu && ` — fin prévue vers ${heure(statut.retourPrevu)}`}
            </span>
          )}
          {statut?.statut === "hors_ligne" && (
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm font-medium text-mention">
              <span className="h-2.5 w-2.5 rounded-full bg-statut-offline" />
              Vous êtes hors ligne
            </span>
          )}
        </div>


        {disponible && statut?.enLigneDepuis && (
          <p className="mb-4 text-sm text-mention">
            En ligne depuis {heure(statut.enLigneDepuis)} · passage automatique
            hors ligne après {statut.autoOffHeures} h
          </p>
        )}
        {enConsultation && (
          <p className="mb-4 text-sm text-mention">
            Le statut reviendra automatiquement à la fin de l&apos;appel.
          </p>
        )}

        <button
          onClick={handleToggle}
          disabled={toggling || enConsultation}
          className={`rounded-full px-10 py-4 text-lg font-medium text-cta-text shadow-card transition disabled:cursor-not-allowed disabled:opacity-50 ${
            disponible ? "bg-ink/70 hover:bg-ink" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {toggling
            ? "Mise à jour…"
            : disponible
            ? "Passer hors ligne"
            : "Passer en ligne"}
        </button>

        <p className="mt-4 text-xs text-mention">
          En ligne : les clientes voient « Elena est en ligne » et peuvent
          lancer une Consultation Immédiate.
        </p>
      </div>

      {/* ===== Lancer une consultation minutée ===== */}
      <div className="mt-8 rounded-2xl border border-greige/70 bg-ivory p-8 shadow-soft">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">
          Lancer une consultation minutée
        </h2>
        <p className="mt-1 text-sm text-mention">
          Pour un rendez-vous déjà réglé (Calendly) : votre téléphone sonne
          d&apos;abord, puis la cliente est appelée. Coupure automatique à la
          durée choisie, signal 2 minutes avant la fin. Aucun débit de crédit.
        </p>

        <form onSubmit={handleLancerConsultation} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Numéro de la cliente
            </label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="06 12 34 56 78"
              required
              className="w-full max-w-xs rounded-lg border border-greige bg-white px-3 py-2 text-aubergine"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-aubergine">Durée</p>
            <div className="flex flex-wrap gap-3">
              {statut?.forfaits?.map((f) => (
                <button
                  key={f.code}
                  type="button"
                  onClick={() => setForfaitCode(f.code)}
                  className={`rounded-xl border px-5 py-3 text-center transition ${
                    forfaitCode === f.code
                      ? "border-cta bg-blush shadow-card"
                      : "border-greige/70 bg-ivory/60 hover:border-cta/50"
                  }`}
                >
                  <span className="block font-serif text-xl font-semibold text-aubergine">
                    {f.minutes} min
                  </span>
                  <span className="text-xs text-mention">{f.nom}</span>
                </button>
              ))}
            </div>
          </div>

          {messageAppel && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              📞 {messageAppel}
            </p>
          )}

          <button
            type="submit"
            disabled={lancement || enConsultation}
            className="rounded-full bg-cta px-8 py-3 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {lancement
              ? "Lancement de l'appel…"
              : enConsultation
              ? "Consultation en cours…"
              : "Lancer l'appel"}
          </button>
        </form>
      </div>

      {/* ===== Vue du jour ===== */}
      <h2 className="mt-10 font-serif text-2xl font-semibold text-aubergine">
        Aujourd&apos;hui
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: `Appels (dont ${jour?.forfaitsManuels ?? 0} forfait${(jour?.forfaitsManuels ?? 0) > 1 ? "s" : ""})`,
            valeur: `${jour?.appelsDuJour ?? 0}`,
          },
          {
            label: "Durée totale",
            valeur: `${jour?.dureeTotaleMinutes ?? 0} min`,
          },
          { label: "Revenus du jour", valeur: euros(jour?.revenusJour ?? 0) },
          {
            label: `Soldes clientes (${jour?.nombreWallets ?? 0} portefeuilles)`,
            valeur: euros(jour?.soldesClientsTotal ?? 0),
          },
        ].map((carte) => (
          <div
            key={carte.label}
            className="rounded-2xl border border-greige/60 bg-ivory p-5 text-center"
          >
            <p className="font-serif text-3xl font-semibold text-prix">
              {carte.valeur}
            </p>
            <p className="mt-1 text-xs text-mention">{carte.label}</p>
          </div>
        ))}
      </div>

      {jour && jour.appelsActifs > 0 && (
        <p className="mt-4 text-sm font-medium text-green-700">
          📞 {jour.appelsActifs} appel{jour.appelsActifs > 1 ? "s" : ""} en
          cours
        </p>
      )}
    </CabinetShell>
  );
}
