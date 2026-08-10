"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import {
  chargerReglages,
  enregistrerReglages,
  REGLAGES_DEFAUT,
  type Reglages,
} from "@/lib/reglages";

interface Forfait {
  code: string;
  nom: string;
  minutes: number;
  prix: number;
}

interface Profil {
  nomPublic: string;
  telephone: string | null;
  email: string | null;
  numeroLigne: string | null;
  tarifs: {
    prixMinute: number;
    creditMinimumMinutes: number;
    bipAvantFinSecondes: number;
    forfaits: Forfait[];
    recharge: {
      suggestionsMinutes: number[];
      defautMinutes: number;
      pasMinutes: number;
      minMinutes: number;
      maxMinutes: number;
    };
  };
  textes: { tagline: string; signature: string; messageAbsence: string };
  autoOffHeures: number;
}

function formatTel(t: string | null): string {
  if (!t) return "—";
  const fr = t.replace(/^\+33/, "0");
  return /^0\d{9}$/.test(fr) ? fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
}

// Encart de section, pour ne pas répéter la mise en forme
function Section({
  titre,
  sous,
  children,
}: {
  titre: string;
  sous?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-3xl border border-greige/50 bg-ivory p-6 shadow-soft">
      <h2 className="font-jakarta text-lg font-bold text-aubergine">{titre}</h2>
      {sous && <p className="mt-0.5 text-sm text-mention">{sous}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default function ProfilPraticiennePage() {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [reglages, setReglages] = useState<Reglages>(REGLAGES_DEFAUT);

  // Tarifs
  const [prixMinute, setPrixMinute] = useState(2.9);
  const [creditMin, setCreditMin] = useState(5);
  const [forfaits, setForfaits] = useState<Forfait[]>([]);
  const [paliers, setPaliers] = useState("10, 20, 30");
  const [maxMinutes, setMaxMinutes] = useState(90);
  const [tarifsMsg, setTarifsMsg] = useState("");
  const [tarifsErr, setTarifsErr] = useState("");
  const [tarifsEnCours, setTarifsEnCours] = useState(false);

  // Textes
  const [tagline, setTagline] = useState("");
  const [signature, setSignature] = useState("");
  const [absence, setAbsence] = useState("");
  const [textesMsg, setTextesMsg] = useState("");
  const [textesEnCours, setTextesEnCours] = useState(false);

  // Changement de numéro — en deux temps : appel, puis code
  const [nouveauTel, setNouveauTel] = useState("");
  const [etapeTel, setEtapeTel] = useState<"saisie" | "code">("saisie");
  const [codeTel, setCodeTel] = useState("");
  const [telMsg, setTelMsg] = useState("");
  const [telErr, setTelErr] = useState("");
  const [telEnCours, setTelEnCours] = useState(false);

  async function demanderVerif(e: React.FormEvent) {
    e.preventDefault();
    setTelMsg("");
    setTelErr("");
    setTelEnCours(true);
    try {
      const r = await api.adminDemanderVerifTel(nouveauTel);
      setTelMsg(r.message);
      setEtapeTel("code");
    } catch (err) {
      setTelErr(err instanceof Error ? err.message : "Erreur");
    } finally {
      setTelEnCours(false);
    }
  }

  async function confirmerVerif(e: React.FormEvent) {
    e.preventDefault();
    setTelMsg("");
    setTelErr("");
    setTelEnCours(true);
    try {
      const r = await api.adminConfirmerVerifTel(codeTel);
      setProfil((p) => (p ? { ...p, telephone: r.telephone } : p));
      setTelMsg("Numéro vérifié et enregistré.");
      setEtapeTel("saisie");
      setNouveauTel("");
      setCodeTel("");
    } catch (err) {
      setTelErr(err instanceof Error ? err.message : "Erreur");
    } finally {
      setTelEnCours(false);
    }
  }

  async function annulerVerif() {
    await api.adminAnnulerVerifTel().catch(() => {});
    setEtapeTel("saisie");
    setCodeTel("");
    setTelMsg("");
    setTelErr("");
  }

  // Mot de passe
  const [mdpActuel, setMdpActuel] = useState("");
  const [mdpNouveau, setMdpNouveau] = useState("");
  const [mdpMsg, setMdpMsg] = useState("");
  const [mdpErr, setMdpErr] = useState("");
  const [mdpEnCours, setMdpEnCours] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    setReglages(chargerReglages());
    api
      .adminGetProfil()
      .then((p: Profil) => {
        setProfil(p);
        setPrixMinute(p.tarifs.prixMinute);
        setCreditMin(p.tarifs.creditMinimumMinutes);
        setForfaits(p.tarifs.forfaits);
        setPaliers(p.tarifs.recharge.suggestionsMinutes.join(", "));
        setMaxMinutes(p.tarifs.recharge.maxMinutes);
        setTagline(p.textes.tagline);
        setSignature(p.textes.signature);
        setAbsence(p.textes.messageAbsence);
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  function majReglage<K extends keyof Reglages>(cle: K, v: Reglages[K]) {
    setReglages(enregistrerReglages({ [cle]: v } as Partial<Reglages>));
  }

  async function enregistrerTarifs(e: React.FormEvent) {
    e.preventDefault();
    setTarifsMsg("");
    setTarifsErr("");
    setTarifsEnCours(true);
    try {
      const suggestions = paliers
        .split(",")
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isFinite(x) && x > 0);
      await api.adminPatchTarifs({
        prixMinute,
        creditMinimumMinutes: creditMin,
        forfaits,
        recharge: { suggestionsMinutes: suggestions, maxMinutes },
      });
      setTarifsMsg("Tarifs enregistrés — ils s'appliquent immédiatement.");
    } catch (err) {
      setTarifsErr(err instanceof Error ? err.message : "Erreur");
    } finally {
      setTarifsEnCours(false);
    }
  }

  async function enregistrerTextes(e: React.FormEvent) {
    e.preventDefault();
    setTextesMsg("");
    setTextesEnCours(true);
    try {
      await api.adminPatchTextes({
        tagline,
        signature,
        messageAbsence: absence,
      });
      setTextesMsg("Textes enregistrés.");
    } catch (err) {
      setTextesMsg(err instanceof Error ? err.message : "Erreur");
    } finally {
      setTextesEnCours(false);
    }
  }

  async function changerMdp(e: React.FormEvent) {
    e.preventDefault();
    setMdpMsg("");
    setMdpErr("");
    if (mdpNouveau.length < 8) {
      setMdpErr("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setMdpEnCours(true);
    try {
      await api.changePassword({
        currentPassword: mdpActuel,
        newPassword: mdpNouveau,
      });
      setMdpMsg("Mot de passe modifié.");
      setMdpActuel("");
      setMdpNouveau("");
    } catch (err) {
      setMdpErr(err instanceof Error ? err.message : "Erreur");
    } finally {
      setMdpEnCours(false);
    }
  }

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse || !profil) notFound();

  const champ =
    "w-full rounded-xl border border-greige bg-ivory px-3 py-2.5 text-ink focus:border-cta-outline focus:outline-none";
  const bouton =
    "rounded-full bg-cta px-6 py-2.5 font-bold text-cta-text transition hover:bg-cta-dark disabled:opacity-50";

  return (
    <CabinetShell>
      <CabinetNav />

      <h1 className="font-jakarta mt-6 text-3xl font-bold tracking-tight text-aubergine">
        Mon profil
      </h1>
      <p className="mt-1 text-sm text-mention">
        Ce que vous pouvez changer vous-même, sans passer par personne.
      </p>

      {/* Coordonnées */}
      <Section titre="Mes coordonnées">
        <dl className="space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-mention">Email</dt>
            <dd className="text-ink">{profil.email || "—"}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-mention">Mon numéro (celui qu&apos;on compose pour moi)</dt>
            <dd className="font-semibold text-ink">{formatTel(profil.telephone)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-mention">Numéro de la ligne (vu par les clientes)</dt>
            <dd className="text-ink">{formatTel(profil.numeroLigne)}</dd>
          </div>
        </dl>
        {/* Changement de numéro : vérifié par appel AVANT enregistrement */}
        <div className="mt-5 border-t border-greige/50 pt-5">
          <p className="text-sm font-medium text-aubergine">
            Changer mon numéro
          </p>
          <p className="mt-0.5 text-xs text-mention">
            Votre téléphone sonnera et une voix vous dictera un code. Votre
            numéro actuel reste actif tant que le code n&apos;est pas confirmé —
            une faute de frappe ne peut donc pas vous rendre injoignable.
          </p>

          {etapeTel === "saisie" ? (
            <form onSubmit={demanderVerif} className="mt-3 flex flex-wrap gap-2">
              <input
                type="tel"
                value={nouveauTel}
                onChange={(e) => setNouveauTel(e.target.value)}
                placeholder="06 12 34 56 78"
                required
                className={`${champ} max-w-56`}
              />
              <button type="submit" disabled={telEnCours} className={bouton}>
                {telEnCours ? "Appel en cours…" : "M'appeler pour vérifier"}
              </button>
            </form>
          ) : (
            <form onSubmit={confirmerVerif} className="mt-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={codeTel}
                  onChange={(e) => setCodeTel(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  required
                  autoFocus
                  className={`${champ} w-28 text-center text-xl font-bold tracking-[0.3em]`}
                />
                <button type="submit" disabled={telEnCours} className={bouton}>
                  {telEnCours ? "Vérification…" : "Confirmer"}
                </button>
                <button
                  type="button"
                  onClick={annulerVerif}
                  className="text-sm text-mention hover:text-aubergine"
                >
                  Annuler
                </button>
              </div>
              <p className="mt-2 text-xs text-mention">
                Le code annoncé pour le {formatTel(nouveauTel)} · valable 10 min
              </p>
            </form>
          )}

          {telMsg && (
            <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              📞 {telMsg}
            </p>
          )}
          {telErr && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {telErr}
            </p>
          )}
        </div>
      </Section>

      {/* Tarifs */}
      <Section
        titre="Mes tarifs et durées"
        sous="Appliqués immédiatement, côté clientes comme côté facturation."
      >
        <form onSubmit={enregistrerTarifs} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-aubergine">
                Prix à la minute (€)
              </span>
              <input
                type="number"
                step={0.1}
                min={0.5}
                max={50}
                value={prixMinute}
                onChange={(e) => setPrixMinute(Number(e.target.value))}
                className={champ}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-aubergine">
                Crédit minimum (min)
              </span>
              <input
                type="number"
                min={1}
                max={60}
                value={creditMin}
                onChange={(e) => setCreditMin(Number(e.target.value))}
                className={champ}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-aubergine">
                Recharge maximale (min)
              </span>
              <input
                type="number"
                min={5}
                max={600}
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(Number(e.target.value))}
                className={champ}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-aubergine">
              Paliers de recharge proposés (minutes, séparées par des virgules)
            </span>
            <input
              type="text"
              value={paliers}
              onChange={(e) => setPaliers(e.target.value)}
              placeholder="10, 20, 30"
              className={champ}
            />
          </label>

          <div>
            <p className="mb-2 text-sm font-medium text-aubergine">Mes forfaits</p>
            <div className="space-y-2">
              {forfaits.map((f, i) => (
                <div key={f.code} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={f.nom}
                    onChange={(e) => {
                      const s = [...forfaits];
                      s[i] = { ...f, nom: e.target.value };
                      setForfaits(s);
                    }}
                    className={`${champ} min-w-48 flex-1`}
                  />
                  <input
                    type="number"
                    min={5}
                    max={240}
                    value={f.minutes}
                    onChange={(e) => {
                      const s = [...forfaits];
                      s[i] = { ...f, minutes: Number(e.target.value) };
                      setForfaits(s);
                    }}
                    className={`${champ} w-24`}
                    aria-label="Durée en minutes"
                  />
                  <span className="text-sm text-mention">min</span>
                  <input
                    type="number"
                    min={1}
                    max={2000}
                    value={f.prix}
                    onChange={(e) => {
                      const s = [...forfaits];
                      s[i] = { ...f, prix: Number(e.target.value) };
                      setForfaits(s);
                    }}
                    className={`${champ} w-24`}
                    aria-label="Prix en euros"
                  />
                  <span className="text-sm text-mention">€</span>
                </div>
              ))}
            </div>
          </div>

          {tarifsMsg && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{tarifsMsg}</p>
          )}
          {tarifsErr && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{tarifsErr}</p>
          )}
          <button type="submit" disabled={tarifsEnCours} className={bouton}>
            {tarifsEnCours ? "Enregistrement…" : "Enregistrer mes tarifs"}
          </button>
        </form>
      </Section>

      {/* Textes */}
      <Section
        titre="Mes textes"
        sous="Ce que vos clientes lisent sur le site."
      >
        <form onSubmit={enregistrerTextes} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-aubergine">
              Baseline
            </span>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Voyante sur l'Amour & Médium en Flashs Directs"
              className={champ}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-aubergine">
              Signature (pied de page)
            </span>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Rien ne meurt, tout se transforme."
              className={champ}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-aubergine">
              Message affiché quand je suis hors ligne
            </span>
            <textarea
              rows={2}
              value={absence}
              onChange={(e) => setAbsence(e.target.value)}
              placeholder="Je reviens jeudi soir · En repos jusqu'au 15…"
              className={champ}
            />
            <span className="mt-1 block text-xs text-mention">
              Laissez vide pour le message générique.
            </span>
          </label>

          {textesMsg && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{textesMsg}</p>
          )}
          <button type="submit" disabled={textesEnCours} className={bouton}>
            {textesEnCours ? "Enregistrement…" : "Enregistrer mes textes"}
          </button>
        </form>
      </Section>

      {/* Réglages de calcul */}
      <Section
        titre="Mes réglages de calcul"
        sous="Utilisés dans l'onglet Revenus. Conservés sur cet appareil."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input
              type="checkbox"
              checked={reglages.tvaActive}
              onChange={(e) => majReglage("tvaActive", e.target.checked)}
              className="h-4 w-4 rounded border-greige accent-cta"
            />
            Je suis assujettie à la TVA
          </label>

          {(
            [
              { cle: "tvaTaux", label: "Taux de TVA (%)", max: 30 },
              { cle: "urssaf", label: "URSSAF (% du HT)", max: 60 },
              { cle: "impot", label: "Impôt (% du HT)", max: 60 },
              { cle: "coutsFixes", label: "Coûts fixes (€/mois)", max: 100000 },
              { cle: "seuilTwilio", label: "Alerte solde ligne (sous)", max: 1000 },
              { cle: "seuilHabituee", label: "« Habituée » à partir de", max: 100 },
            ] as const
          ).map((r) => (
            <label key={r.cle} className="block">
              <span className="mb-1 block text-sm font-medium text-aubergine">
                {r.label}
              </span>
              <input
                type="number"
                min={0}
                max={r.max}
                step={r.cle === "coutsFixes" || r.cle === "seuilHabituee" ? 1 : 0.1}
                value={reglages[r.cle] as number}
                onChange={(e) => majReglage(r.cle, Number(e.target.value) as never)}
                className={champ}
              />
            </label>
          ))}
        </div>
      </Section>

      {/* Mot de passe */}
      <Section titre="Mon mot de passe">
        <form onSubmit={changerMdp} className="max-w-sm space-y-3">
          <input
            type="password"
            value={mdpActuel}
            onChange={(e) => setMdpActuel(e.target.value)}
            placeholder="Mot de passe actuel"
            autoComplete="current-password"
            required
            className={champ}
          />
          <input
            type="password"
            value={mdpNouveau}
            onChange={(e) => setMdpNouveau(e.target.value)}
            placeholder="Nouveau mot de passe (8 caractères min.)"
            autoComplete="new-password"
            required
            className={champ}
          />
          {mdpMsg && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{mdpMsg}</p>
          )}
          {mdpErr && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{mdpErr}</p>
          )}
          <button type="submit" disabled={mdpEnCours} className={bouton}>
            {mdpEnCours ? "Modification…" : "Changer mon mot de passe"}
          </button>
        </form>
      </Section>

      {/* À venir */}
      <Section titre="Bientôt disponible">
        <ul className="space-y-1.5 text-sm text-mention">
          <li>· Ma photo (profil et page d&apos;accueil)</li>
          <li>· Mes messages vocaux (accueil, attente, fin, répondeur)</li>
        </ul>
        <p className="mt-3 text-xs text-mention">
          Ces deux fonctions demandent d&apos;activer le stockage de fichiers
          dans Supabase — une action à faire dans votre tableau de bord.
        </p>
      </Section>

      <p className="mt-6 text-center text-xs text-mention">
        Cette page vous appartient : rien de ce qui s&apos;y trouve
        n&apos;est visible par vos clientes.
      </p>
    </CabinetShell>
  );
}
