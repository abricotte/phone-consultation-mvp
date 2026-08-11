"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import {
  enregistrerReglages,
  lireReglagesLocaux,
  oublierReglagesLocaux,
  REGLAGES_DEFAUT,
  type Reglages,
} from "@/lib/reglages";

interface Forfait {
  code: string;
  nom: string;
  minutes: number;
  prix: number;
}

// Choix fermés plutôt que saisie libre : sur cette page, une faute de frappe
// ne casse pas un écran, elle facture réellement une cliente.
const PALIERS_POSSIBLES = [5, 10, 15, 20, 30, 45, 60, 90];
const DUREES_FORFAIT = [15, 20, 30, 45, 60];

// 1,90 € → 4,90 € par pas de 10 centimes
const PRIX_MINUTE_POSSIBLES = Array.from(
  { length: 31 },
  (_, i) => Math.round((1.9 + i * 0.1) * 100) / 100
);

// Prix de forfait par pas de 5 €, jusqu'à 300 €
const PRIX_FORFAIT_POSSIBLES = Array.from({ length: 60 }, (_, i) => (i + 1) * 5);

// Bornes dures — miroir de backend/src/utils/tarifs.js, qui fait foi.
const RATIO_FORFAIT_MIN = 0.5;

const euros = (n: number) => n.toFixed(2).replace(".", ",") + " €";

interface Profil {
  nomPublic: string;
  telephone: string | null;
  email: string | null;
  numeroLigne: string | null;
  tarifs: {
    prixMinute: number;
    /** Les prix affichés sont TTC (obligatoire pour des particuliers) */
    prixTTC: boolean;
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
  reglages: Reglages;
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
  const [reglagesErr, setReglagesErr] = useState("");

  // Tarifs
  const [prixMinute, setPrixMinute] = useState(2.9);
  const [creditMin, setCreditMin] = useState(5);
  const [forfaits, setForfaits] = useState<Forfait[]>([]);
  // Cases à cocher plutôt qu'un champ texte : une virgule oubliée dans
  // « 10, 20, 30 » cassait la page de recharge des clientes.
  const [paliers, setPaliers] = useState<number[]>([10, 20, 30]);
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
    api
      .adminGetProfil()
      .then((p: Profil) => {
        setProfil(p);
        setPrixMinute(p.tarifs.prixMinute);
        setCreditMin(p.tarifs.creditMinimumMinutes);
        setForfaits(p.tarifs.forfaits);
        setPaliers(p.tarifs.recharge.suggestionsMinutes);
        setMaxMinutes(p.tarifs.recharge.maxMinutes);
        setTagline(p.textes.tagline);
        setSignature(p.textes.signature);
        setAbsence(p.textes.messageAbsence);
        // La base fait foi. Si ce navigateur détient encore d'anciens
        // réglages locaux, on les remonte UNE fois — c'est ainsi que le
        // 23 % d'URSSAF resté figé ici retrouve le chemin du serveur —
        // puis on efface la copie locale pour qu'elle ne dérive plus.
        // Le serveur peut être d'une version antérieure (le frontend et le
        // backend ne se déploient jamais à la même seconde) : sans ce repli,
        // la page planterait sur des réglages absents.
        setReglages(p.reglages ?? REGLAGES_DEFAUT);
        const locaux = lireReglagesLocaux();
        if (locaux) {
          enregistrerReglages(locaux)
            .then(setReglages)
            .catch(() => {})
            .finally(oublierReglagesLocaux);
        }
      })
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, []);

  // Les réglages partent au serveur : ils doivent suivre Elena d'un
  // navigateur à l'autre, pas rester dans le cache d'une machine.
  function majReglage<K extends keyof Reglages>(cle: K, v: Reglages[K]) {
    setReglages({ ...reglages, [cle]: v }); // réponse immédiate à l'écran
    setReglagesErr("");
    enregistrerReglages({ [cle]: v })
      .then(setReglages)
      .catch(() =>
        setReglagesErr("Réglage non enregistré — vérifiez votre connexion.")
      );
  }

  // Les tarifs enregistrés, pour savoir ce qui a bougé et pouvoir annuler.
  const initial = profil?.tarifs;
  const modifie =
    !!initial &&
    (prixMinute !== initial.prixMinute ||
      creditMin !== initial.creditMinimumMinutes ||
      maxMinutes !== initial.recharge.maxMinutes ||
      JSON.stringify(paliers) !== JSON.stringify(initial.recharge.suggestionsMinutes) ||
      JSON.stringify(forfaits) !== JSON.stringify(initial.forfaits));

  function annulerTarifs() {
    if (!initial) return;
    setPrixMinute(initial.prixMinute);
    setCreditMin(initial.creditMinimumMinutes);
    setMaxMinutes(initial.recharge.maxMinutes);
    setPaliers(initial.recharge.suggestionsMinutes);
    setForfaits(initial.forfaits);
    setTarifsErr("");
    setTarifsMsg("");
  }

  // Blocages durs — miroir de backend/src/utils/tarifs.js, qui reste
  // l'autorité. Ici ils servent à expliquer AVANT d'essayer d'enregistrer.
  const blocages: string[] = [];
  if (paliers.length === 0) {
    blocages.push("Aucun palier de recharge coché : vos clientes n'auraient rien à choisir.");
  }
  for (const f of forfaits) {
    if (!f.nom.trim()) {
      blocages.push("Un forfait n'a pas de nom.");
      continue;
    }
    const parMinute = f.minutes > 0 ? f.prix / f.minutes : 0;
    if (parMinute < prixMinute * RATIO_FORFAIT_MIN) {
      blocages.push(
        `« ${f.nom} » revient à ${euros(parMinute)}/min, moins de la moitié de votre tarif — vérifiez : ${f.prix} € pour ${f.minutes} min.`
      );
    }
  }

  async function enregistrerTarifs(e: React.FormEvent) {
    e.preventDefault();
    setTarifsMsg("");
    setTarifsErr("");
    setTarifsEnCours(true);
    try {
      await api.adminPatchTarifs({
        prixMinute,
        creditMinimumMinutes: creditMin,
        forfaits,
        recharge: { suggestionsMinutes: [...paliers].sort((a, b) => a - b), maxMinutes },
      });
      // Nouvelle référence : le récapitulatif se referme, et « Annuler »
      // revient désormais à ces valeurs-ci.
      const suivants = [...paliers].sort((a, b) => a - b);
      setPaliers(suivants);
      setProfil((p) =>
        p
          ? {
              ...p,
              tarifs: {
                ...p.tarifs,
                prixMinute,
                creditMinimumMinutes: creditMin,
                forfaits,
                recharge: { ...p.tarifs.recharge, suggestionsMinutes: suivants, maxMinutes },
              },
            }
          : p
      );
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
              <select
                value={prixMinute}
                onChange={(e) => setPrixMinute(Number(e.target.value))}
                className={champ}
              >
                {PRIX_MINUTE_POSSIBLES.map((p) => (
                  <option key={p} value={p}>
                    {euros(p)}
                  </option>
                ))}
              </select>
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

          <div>
            <span className="mb-1 block text-sm font-medium text-aubergine">
              Paliers de recharge proposés
            </span>
            <p className="mb-2 text-xs text-mention">
              Cochez les durées que vous proposez. Le prix se calcule tout seul.
            </p>
            <div className="flex flex-wrap gap-2">
              {PALIERS_POSSIBLES.map((m) => {
                const coche = paliers.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={coche}
                    onClick={() =>
                      setPaliers((p) =>
                        p.includes(m) ? p.filter((x) => x !== m) : [...p, m].sort((a, b) => a - b)
                      )
                    }
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      coche
                        ? "border-aubergine bg-aubergine text-cream"
                        : "border-greige/60 bg-white text-mention hover:border-aubergine/40 hover:text-aubergine"
                    }`}
                  >
                    {m} min
                    <span className="ml-1.5 text-xs opacity-70">
                      {(m * prixMinute).toFixed(2).replace(".", ",")} €
                    </span>
                  </button>
                );
              })}
            </div>
            {paliers.length === 0 && (
              <p className="mt-2 text-xs text-red-600">
                Cochez au moins une durée, sinon vos clientes n'auront rien à choisir.
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-aubergine">Mes forfaits</p>
            {/* Une ligne par forfait, unités dans les champs. Le prix/minute
                implicite s'affiche à droite : c'est lui qui rend une faute
                de frappe évidente (12 € pour 45 min → 0,27 €/min). */}
            <div className="space-y-2">
              {forfaits.map((f, i) => {
                const parMinute = f.minutes > 0 ? f.prix / f.minutes : 0;
                const suspect = parMinute < prixMinute * RATIO_FORFAIT_MIN;
                return (
                  <div
                    key={f.code}
                    className={`flex flex-wrap items-center gap-2 rounded-2xl border p-2 ${
                      suspect ? "border-red-300 bg-red-50/50" : "border-transparent"
                    }`}
                  >
                    <input
                      type="text"
                      value={f.nom}
                      onChange={(e) => {
                        const s = [...forfaits];
                        s[i] = { ...f, nom: e.target.value };
                        setForfaits(s);
                      }}
                      className={`${champ} min-w-40 flex-1`}
                      aria-label="Nom du forfait"
                    />
                    <select
                      value={f.minutes}
                      onChange={(e) => {
                        const s = [...forfaits];
                        s[i] = { ...f, minutes: Number(e.target.value) };
                        setForfaits(s);
                      }}
                      className={`${champ} w-28`}
                      aria-label="Durée du forfait"
                    >
                      {[...new Set([...DUREES_FORFAIT, f.minutes])]
                        .sort((a, b) => a - b)
                        .map((m) => (
                          <option key={m} value={m}>
                            {m} min
                          </option>
                        ))}
                    </select>
                    <select
                      value={f.prix}
                      onChange={(e) => {
                        const s = [...forfaits];
                        s[i] = { ...f, prix: Number(e.target.value) };
                        setForfaits(s);
                      }}
                      className={`${champ} w-28`}
                      aria-label="Prix du forfait"
                    >
                      {[...new Set([...PRIX_FORFAIT_POSSIBLES, f.prix])]
                        .sort((a, b) => a - b)
                        .map((p) => (
                          <option key={p} value={p}>
                            {p} €
                          </option>
                        ))}
                    </select>
                    <span
                      className={`w-24 text-right text-xs tabular-nums ${
                        suspect ? "font-bold text-red-600" : "text-mention"
                      }`}
                    >
                      {euros(parMinute)}/min
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {tarifsMsg && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{tarifsMsg}</p>
          )}
          {tarifsErr && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{tarifsErr}</p>
          )}

          {/* RÉCAPITULATIF DE CONTRÔLE — n'apparaît qu'après modification.
              Il énonce ce que les clientes verront, en toutes lettres : c'est
              le dernier moment où une erreur se rattrape sans coûter. */}
          {modifie && (
            <div className="rounded-2xl border border-gold/50 bg-gold/5 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-dark">
                ✦ Vos clientes verront
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                <strong>{euros(prixMinute)}/min</strong> · recharge minimum{" "}
                {creditMin} min = <strong>{euros(creditMin * prixMinute)}</strong> ·
                maximum {maxMinutes} min ={" "}
                <strong>{euros(maxMinutes * prixMinute)}</strong>.
              </p>
              {forfaits.length > 0 && (
                <p className="mt-1 text-sm leading-relaxed text-ink">
                  {forfaits.map((f, i) => (
                    <span key={f.code}>
                      {i > 0 && " "}
                      {f.nom} {f.minutes} min = <strong>{euros(f.prix)}</strong> (
                      {euros(f.minutes > 0 ? f.prix / f.minutes : 0)}/min).
                    </span>
                  ))}
                </p>
              )}
              {paliers.length > 0 && (
                <p className="mt-1 text-xs text-mention">
                  Paliers proposés : {paliers.map((m) => `${m} min`).join(" · ")}
                </p>
              )}

              {blocages.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-gold/30 pt-3">
                  {blocages.map((b) => (
                    <li key={b} className="text-sm font-medium text-red-600">
                      ✗ {b}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={annulerTarifs}
                  className="rounded-full border border-greige/60 bg-white px-5 py-2 text-sm font-medium text-mention transition hover:text-aubergine"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={tarifsEnCours || blocages.length > 0}
                  className={`${bouton} disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  {tarifsEnCours ? "Enregistrement…" : "Confirmer ces tarifs"}
                </button>
              </div>
            </div>
          )}

          {!modifie && (
            <p className="text-sm text-mention">
              Modifiez un tarif pour voir ce que vos clientes verront.
            </p>
          )}
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

          {/* Chaque réglage dit ce qu'il déclenche. « Alerte solde ligne
              (sous) » ne voulait rien dire pour qui ne connaît pas Twilio —
              et c'est pourtant le réglage qui empêche la ligne de tomber. */}
          {(
            [
              {
                cle: "tvaTaux",
                label: "Taux de TVA",
                unite: "%",
                max: 30,
                aide: "Retirée de vos encaissements avant tout le reste : elle ne vous appartient pas.",
              },
              {
                cle: "urssaf",
                label: "Cotisations URSSAF",
                unite: "% du chiffre d'affaires HT",
                max: 60,
                aide: "25,6 % de cotisations + CFP. Provisionné sur chaque encaissement.",
              },
              {
                cle: "impot",
                label: "Impôt sur le revenu",
                unite: "% du chiffre d'affaires HT",
                max: 60,
                aide: "Provision volontairement un peu haute, par prudence.",
              },
              {
                cle: "coutsFixes",
                label: "Mes abonnements mensuels",
                unite: "€ par mois",
                max: 100000,
                aide: "Hébergement, nom de domaine… Déduits de votre net mensuel.",
              },
              {
                cle: "seuilTwilio",
                label: "M'alerter quand mon crédit d'appel passe sous",
                unite: "€",
                max: 1000,
                aide:
                  "Ce crédit paie vos appels. S'il tombe à zéro, vos clientes ne peuvent plus vous joindre — sans que rien ne vous prévienne.",
              },
              {
                cle: "seuilHabituee",
                label: "Une cliente est « habituée » à partir de",
                unite: "consultations",
                max: 100,
                aide:
                  "Sert uniquement à filtrer votre liste de clientes. Invisible pour elles, et sans effet sur les tarifs.",
              },
            ] as const
          ).map((r) => (
            <div key={r.cle}>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-aubergine">
                  {r.label}
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={r.max}
                    step={r.cle === "coutsFixes" || r.cle === "seuilHabituee" ? 1 : 0.1}
                    value={reglages[r.cle] as number}
                    onChange={(e) => majReglage(r.cle, Number(e.target.value) as never)}
                    className={`${champ} w-28`}
                  />
                  <span className="text-sm text-mention">{r.unite}</span>
                </span>
              </label>
              <p className="mt-1 text-xs leading-relaxed text-mention">{r.aide}</p>
            </div>
          ))}

          {reglagesErr && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {reglagesErr}
            </p>
          )}
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
