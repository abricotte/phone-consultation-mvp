"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { signeAstrologique, formatDateNaissance } from "@/lib/astro";

interface Proche {
  id: string;
  prenom: string;
  dateNaissance: string | null;
  lien: string;
}

const LIENS: { value: string; label: string }[] = [
  { value: "compagnon", label: "Compagnon / compagne" },
  { value: "ex", label: "Ex" },
  { value: "mere", label: "Mère" },
  { value: "pere", label: "Père" },
  { value: "enfant", label: "Enfant" },
  { value: "ami", label: "Ami(e)" },
  { value: "autre", label: "Autre" },
];

function libelleLien(value: string): string {
  return LIENS.find((l) => l.value === value)?.label || "Autre";
}

// Teintes douces pour les avatars des proches (cycle par index)
const TEINTES = [
  "bg-coral/15 text-coral-dark",
  "bg-gold/20 text-gold-dark",
  "bg-aubergine/10 text-aubergine",
];

export default function ProfilPage() {
  const [prenom, setPrenom] = useState<string | null>(null);
  const [dateNaissance, setDateNaissance] = useState<string>("");
  const [dateEnregistree, setDateEnregistree] = useState<string | null>(null);
  const [proches, setProches] = useState<Proche[]>([]);
  const [chargement, setChargement] = useState(true);

  const [editionDate, setEditionDate] = useState(false);
  const [dateEnCours, setDateEnCours] = useState(false);
  const [dateErreur, setDateErreur] = useState("");

  // Formulaire d'ajout de proche
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [pPrenom, setPPrenom] = useState("");
  const [pDate, setPDate] = useState("");
  const [pLien, setPLien] = useState("compagnon");
  const [pEnCours, setPEnCours] = useState(false);
  const [pErreur, setPErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getProfil()
      .then(
        (data: {
          prenom: string | null;
          dateNaissance: string | null;
          proches: Proche[];
        }) => {
          setPrenom(data.prenom);
          setDateNaissance(data.dateNaissance || "");
          setDateEnregistree(data.dateNaissance);
          setProches(data.proches || []);
        }
      )
      .catch((err) => {
        if (err instanceof Error && err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => setChargement(false));
  }, []);

  async function handleDateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDateErreur("");
    setDateEnCours(true);
    try {
      const res = await api.updateProfil({
        dateNaissance: dateNaissance || null,
      });
      setDateEnregistree(res.dateNaissance);
      setEditionDate(false);
    } catch (err) {
      setDateErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setDateEnCours(false);
    }
  }

  async function handleAddProche(e: React.FormEvent) {
    e.preventDefault();
    setPErreur("");
    if (!pPrenom.trim()) {
      setPErreur("Le prénom est requis.");
      return;
    }
    setPEnCours(true);
    try {
      const proche = await api.addProche({
        prenom: pPrenom.trim(),
        dateNaissance: pDate || null,
        lien: pLien,
      });
      setProches((prev) => [...prev, proche]);
      setPPrenom("");
      setPDate("");
      setPLien("compagnon");
      setAjoutOuvert(false);
    } catch (err) {
      setPErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPEnCours(false);
    }
  }

  async function handleDeleteProche(id: string) {
    const sauvegarde = proches;
    setProches((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.deleteProche(id);
    } catch {
      setProches(sauvegarde);
    }
  }

  const signe = signeAstrologique(dateEnregistree);
  const montrerInput = editionDate || !dateEnregistree;

  if (chargement)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <a
        href="/dashboard"
        className="text-sm font-medium text-prix transition-colors hover:text-cta"
      >
        ← Retour à mon espace
      </a>

      <header className="mt-4">
        <h1 className="font-serif text-4xl font-semibold text-aubergine">
          Mon profil
        </h1>
        <p className="mt-1 text-mention">
          Votre carnet intime, pour des lectures plus justes.
        </p>
      </header>

      {/* Confidentialité — note fine et rassurante */}
      <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-blush px-4 py-3">
        <span aria-hidden className="mt-0.5 text-base">
          🔒
        </span>
        <p className="text-sm text-ink">
          Tout est <strong className="font-semibold text-aubergine">facultatif</strong>{" "}
          et reste <strong className="font-semibold text-aubergine">strictement privé</strong>{" "}
          — visible uniquement par vous et par Elena.
        </p>
      </div>

      {/* Votre ciel — médaillon signe astro */}
      <section className="relative mt-6 overflow-hidden rounded-3xl border border-greige/60 bg-gradient-to-br from-blush via-cream to-cream p-7 shadow-soft">
        {/* étoiles décoratives */}
        <span aria-hidden className="pointer-events-none absolute right-8 top-6 text-lg text-gold/50">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-16 top-16 text-xs text-coral/40">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-28 top-8 text-[0.6rem] text-gold/40">✦</span>

        <div className="flex items-center gap-5">
          {/* Médaillon */}
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl ring-1 ${
              signe
                ? "bg-gradient-to-br from-gold-light to-gold text-aubergine ring-gold-dark/30"
                : "bg-greige/40 text-mention ring-greige"
            }`}
            style={
              signe
                ? { boxShadow: "inset 0 2px 8px rgba(255,255,255,0.55)" }
                : undefined
            }
          >
            {signe ? signe.emoji : "✦"}
          </div>

          <div className="min-w-0">
            {signe ? (
              <>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-mention">
                  Votre signe
                </p>
                <p className="font-serif text-3xl font-semibold text-aubergine">
                  {signe.nom}
                </p>
                {dateEnregistree && (
                  <p className="mt-0.5 text-sm text-mention">
                    née le {formatDateNaissance(dateEnregistree)}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-serif text-2xl font-semibold text-aubergine">
                  {prenom ? `Bonjour ${prenom}` : "Votre ciel"}
                </p>
                <p className="mt-0.5 text-sm text-mention">
                  Ajoutez votre date de naissance pour révéler votre signe.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Date de naissance — affichage / édition */}
        <div className="mt-5 border-t border-greige/50 pt-5">
          <p className="text-xs text-mention">
            Pour votre lecture et votre cadeau d&apos;anniversaire 🎁
          </p>

          {montrerInput ? (
            <form onSubmit={handleDateSubmit} className="mt-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="date"
                  value={dateNaissance}
                  onChange={(e) => setDateNaissance(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-greige bg-ivory px-3 py-2.5 text-ink focus:border-cta-outline focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={dateEnCours || dateNaissance === (dateEnregistree || "")}
                    className="whitespace-nowrap rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
                  >
                    {dateEnCours ? "…" : "Enregistrer"}
                  </button>
                  {dateEnregistree && (
                    <button
                      type="button"
                      onClick={() => {
                        setDateNaissance(dateEnregistree || "");
                        setEditionDate(false);
                        setDateErreur("");
                      }}
                      className="whitespace-nowrap rounded-full px-4 py-2.5 text-sm text-mention hover:text-aubergine"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>
              {dateErreur && (
                <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
                  {dateErreur}
                </p>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setEditionDate(true)}
              className="mt-1 text-sm font-medium text-prix transition-colors hover:text-cta"
            >
              Modifier ma date de naissance
            </button>
          )}
        </div>
      </section>

      {/* Les personnes qui comptent */}
      <section className="mt-6 rounded-3xl border border-greige/60 bg-ivory p-7 shadow-soft">
        <h2 className="font-serif text-2xl font-semibold text-aubergine">
          Les personnes qui comptent
        </h2>
        <p className="mt-1 text-sm text-mention">
          Les proches sur lesquels vous consultez souvent — Elena les aura sous
          les yeux pendant votre appel.
        </p>

        {/* Liste */}
        {proches.length > 0 ? (
          <ul className="mt-5 space-y-2.5">
            {proches.map((p, i) => {
              const s = signeAstrologique(p.dateNaissance);
              return (
                <li
                  key={p.id}
                  className="group flex items-center gap-3 rounded-2xl border border-greige/50 bg-cream px-4 py-3"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-serif text-lg font-semibold ${
                      TEINTES[i % TEINTES.length]
                    }`}
                  >
                    {p.prenom.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-ink">
                        {p.prenom}
                      </span>
                      <span className="shrink-0 rounded-full bg-blush px-2.5 py-0.5 text-xs text-mention">
                        {libelleLien(p.lien)}
                      </span>
                    </div>
                    {p.dateNaissance && (
                      <p className="mt-0.5 text-xs text-mention">
                        {formatDateNaissance(p.dateNaissance)}
                        {s && ` · ${s.emoji} ${s.nom}`}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteProche(p.id)}
                    aria-label={`Supprimer ${p.prenom}`}
                    className="shrink-0 rounded-full p-2 text-mention/60 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M4 4l8 8M12 4l-8 8"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          !ajoutOuvert && (
            <div className="mt-5 rounded-2xl border border-dashed border-greige bg-cream/60 px-5 py-8 text-center">
              <p className="text-3xl">✦</p>
              <p className="mt-2 text-sm text-mention">
                Aucun proche pour l&apos;instant.
              </p>
            </div>
          )
        )}

        {/* Ajout : bouton -> formulaire déplié */}
        {ajoutOuvert ? (
          <form
            onSubmit={handleAddProche}
            className="mt-4 rounded-2xl border border-cta-outline/40 bg-blush/50 p-5"
          >
            <p className="mb-3 font-serif text-lg font-semibold text-aubergine">
              Ajouter une personne
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-mention">Prénom</label>
                <input
                  type="text"
                  value={pPrenom}
                  onChange={(e) => setPPrenom(e.target.value)}
                  placeholder="Son prénom"
                  autoFocus
                  className="w-full rounded-xl border border-greige bg-ivory px-3 py-2 text-ink focus:border-cta-outline focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-mention">Lien</label>
                <select
                  value={pLien}
                  onChange={(e) => setPLien(e.target.value)}
                  className="w-full rounded-xl border border-greige bg-ivory px-3 py-2 text-ink focus:border-cta-outline focus:outline-none"
                >
                  {LIENS.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-mention">
                  Date de naissance (facultatif)
                </label>
                <input
                  type="date"
                  value={pDate}
                  onChange={(e) => setPDate(e.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full rounded-xl border border-greige bg-ivory px-3 py-2 text-ink focus:border-cta-outline focus:outline-none"
                />
              </div>
            </div>

            {pErreur && (
              <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">
                {pErreur}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <button
                type="submit"
                disabled={pEnCours}
                className="rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text shadow-card transition hover:bg-cta-dark disabled:opacity-50"
              >
                {pEnCours ? "Ajout…" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setAjoutOuvert(false);
                  setPErreur("");
                }}
                className="rounded-full px-4 py-2.5 text-sm text-mention hover:text-aubergine"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAjoutOuvert(true)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-cta-outline bg-ivory px-5 py-3 font-medium text-prix transition hover:bg-cta hover:text-cta-text"
          >
            <span className="text-lg leading-none">＋</span>
            Ajouter une personne
          </button>
        )}

        <p className="mt-5 text-xs text-mention">
          Les informations concernant des tiers sont conservées pour le seul
          usage privé de vos consultations. Voir notre{" "}
          <a
            href="https://elena-wolska.com/confidentialite"
            className="text-prix hover:underline"
          >
            politique de confidentialité
          </a>
          .
        </p>
      </section>
    </div>
  );
}
