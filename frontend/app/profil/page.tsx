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

export default function ProfilPage() {
  const [prenom, setPrenom] = useState<string | null>(null);
  const [dateNaissance, setDateNaissance] = useState<string>("");
  const [dateEnregistree, setDateEnregistree] = useState<string | null>(null);
  const [proches, setProches] = useState<Proche[]>([]);
  const [chargement, setChargement] = useState(true);

  const [dateEnCours, setDateEnCours] = useState(false);
  const [dateMessage, setDateMessage] = useState("");
  const [dateErreur, setDateErreur] = useState("");

  // Formulaire d'ajout de proche
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
    setDateMessage("");
    setDateErreur("");
    setDateEnCours(true);
    try {
      const res = await api.updateProfil({
        dateNaissance: dateNaissance || null,
      });
      setDateEnregistree(res.dateNaissance);
      setDateMessage("Votre date de naissance a bien été enregistrée.");
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
    } catch (err) {
      setPErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setPEnCours(false);
    }
  }

  async function handleDeleteProche(id: string) {
    // Optimiste : on retire tout de suite, on remet en cas d'échec
    const sauvegarde = proches;
    setProches((prev) => prev.filter((p) => p.id !== id));
    try {
      await api.deleteProche(id);
    } catch {
      setProches(sauvegarde);
    }
  }

  const signe = signeAstrologique(dateEnregistree);

  if (chargement)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <a
        href="/dashboard"
        className="text-sm font-medium text-prix hover:underline"
      >
        ← Retour à mon espace
      </a>

      <h1 className="mt-4 font-serif text-3xl font-semibold text-aubergine">
        Mon profil
      </h1>

      {/* Bandeau confidentialité (RGPD) */}
      <div className="mt-4 rounded-2xl border border-cta-outline/40 bg-cta/5 p-4">
        <p className="text-sm text-aubergine">
          🔒 Ces informations restent{" "}
          <strong className="font-semibold">strictement privées</strong> —
          visibles uniquement par vous et par Elena, pour préparer vos
          consultations.
        </p>
        <p className="mt-1 text-xs text-mention">
          Tout est facultatif : rien de tout cela n&apos;est requis pour
          consulter.
        </p>
      </div>

      {/* Vous */}
      <div className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          {prenom ? `Vous, ${prenom}` : "Vous"}
        </h2>

        <form onSubmit={handleDateSubmit} className="mt-4">
          <label className="mb-1 block text-sm font-medium text-aubergine">
            Date de naissance
          </label>
          <p className="mb-2 text-xs text-mention">
            Pour votre lecture et votre cadeau d&apos;anniversaire 🎁
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="date"
              value={dateNaissance}
              onChange={(e) => setDateNaissance(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
            />
            <button
              type="submit"
              disabled={dateEnCours || dateNaissance === (dateEnregistree || "")}
              className="whitespace-nowrap rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text hover:bg-cta-dark disabled:opacity-50"
            >
              {dateEnCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>

          {signe && (
            <p className="mt-3 text-sm text-ink">
              <span className="mr-1 text-lg">{signe.emoji}</span>
              Signe astrologique :{" "}
              <span className="font-semibold text-aubergine">{signe.nom}</span>
              {dateEnregistree && (
                <span className="text-mention">
                  {" "}
                  · né(e) le {formatDateNaissance(dateEnregistree)}
                </span>
              )}
            </p>
          )}

          {dateMessage && (
            <p className="mt-3 rounded-lg bg-green-50 p-2 text-sm text-green-700">
              {dateMessage}
            </p>
          )}
          {dateErreur && (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">
              {dateErreur}
            </p>
          )}
        </form>
      </div>

      {/* Les personnes qui comptent */}
      <div className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Les personnes qui comptent
        </h2>
        <p className="mt-1 text-sm text-mention">
          Ajoutez les proches sur lesquels vous consultez souvent — Elena les
          aura sous les yeux pendant votre appel.
        </p>

        {/* Liste */}
        {proches.length > 0 && (
          <ul className="mt-4 space-y-2">
            {proches.map((p) => {
              const s = signeAstrologique(p.dateNaissance);
              return (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-greige/50 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {p.prenom}{" "}
                      <span className="text-sm font-normal text-mention">
                        · {libelleLien(p.lien)}
                      </span>
                    </p>
                    {p.dateNaissance && (
                      <p className="text-xs text-mention">
                        {formatDateNaissance(p.dateNaissance)}
                        {s && ` · ${s.emoji} ${s.nom}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteProche(p.id)}
                    aria-label={`Supprimer ${p.prenom}`}
                    className="shrink-0 rounded-full px-3 py-1 text-sm text-mention hover:bg-red-50 hover:text-red-600"
                  >
                    Supprimer
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Formulaire d'ajout */}
        <form
          onSubmit={handleAddProche}
          className="mt-4 rounded-xl border border-dashed border-greige bg-white/60 p-4"
        >
          <p className="mb-3 text-sm font-medium text-aubergine">
            Ajouter une personne
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-mention">Prénom</label>
              <input
                type="text"
                value={pPrenom}
                onChange={(e) => setPPrenom(e.target.value)}
                placeholder="Prénom"
                className="w-full rounded-lg border border-greige bg-white px-3 py-2 text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-mention">Lien</label>
              <select
                value={pLien}
                onChange={(e) => setPLien(e.target.value)}
                className="w-full rounded-lg border border-greige bg-white px-3 py-2 text-ink"
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
                className="w-full rounded-lg border border-greige bg-white px-3 py-2 text-ink"
              />
            </div>
          </div>

          {pErreur && (
            <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-600">
              {pErreur}
            </p>
          )}

          <button
            type="submit"
            disabled={pEnCours}
            className="mt-3 rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text hover:bg-cta-dark disabled:opacity-50"
          >
            {pEnCours ? "Ajout…" : "Ajouter"}
          </button>
        </form>

        <p className="mt-4 text-xs text-mention">
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
      </div>
    </div>
  );
}
