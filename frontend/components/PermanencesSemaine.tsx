"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// MES PERMANENCES — l'agenda hebdomadaire des créneaux annoncés.
//
// Le principe, posé par Elena et répété partout où il doit l'être :
// « LE CALENDRIER ANNONCE, LE BOUTON FAIT FOI. » Poser un créneau ici
// n'ouvre jamais les appels — seule la bascule « en ligne » le fait.
// Ces créneaux alimentent les écriteaux du site et de l'espace cliente :
// « prochaine permanence mardi 16:00 – 19:00 », « Elena arrive », etc.

interface Creneau {
  id: string;
  debut: string;
  fin: string;
}

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// Deux listes par pas de 15 minutes, de 07:00 à 23:45 — des choix qui
// existent vraiment, au lieu du sélecteur natif qui fait défiler minute
// par minute. La liste de FIN ne propose que des heures postérieures au
// début : impossible de poser 19:00 → 16:00 par erreur.
const HEURES: string[] = [];
for (let h = 7; h <= 23; h++) {
  for (const m of ["00", "15", "30", "45"]) {
    HEURES.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

/** « 3 h de permanence », « 1 h 30 de permanence », « 45 min » */
function libelleDuree(debut: string, fin: string): string {
  const [hd, md] = debut.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  const minutes = hf * 60 + mf - (hd * 60 + md);
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min de permanence`;
  if (m === 0) return `${h} h de permanence`;
  return `${h} h ${String(m).padStart(2, "0")} de permanence`;
}

/** 'YYYY-MM-DD' en heure de Paris */
function jourISO(d: Date): string {
  return d.toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
}

/** Le lundi de la semaine contenant `d` (décalage en jours entiers). */
function lundiDe(d: Date): Date {
  const jour = new Date(`${jourISO(d)}T12:00:00`);
  const decalage = (jour.getDay() + 6) % 7; // lundi = 0
  return new Date(jour.getTime() - decalage * 86_400_000);
}

function heure(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export default function PermanencesSemaine() {
  const [lundi, setLundi] = useState<Date>(() => lundiDe(new Date()));
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [ajoutJour, setAjoutJour] = useState<number | null>(null);
  const [heureDebut, setHeureDebut] = useState("16:00");
  const [heureFin, setHeureFin] = useState("19:00");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const semaineISO = jourISO(lundi);

  const recharger = useCallback(() => {
    api
      .adminGetPermanences(semaineISO)
      .then((r: { creneaux: Creneau[] }) => setCreneaux(r.creneaux || []))
      .catch(() => setCreneaux([]));
  }, [semaineISO]);

  useEffect(recharger, [recharger]);

  function dateDuJourIndex(i: number): Date {
    return new Date(lundi.getTime() + i * 86_400_000);
  }

  async function poser(jourIndex: number) {
    if (!heureDebut || !heureFin) return;
    setEnCours(true);
    setErreur("");
    setMessage("");
    try {
      const j = jourISO(dateDuJourIndex(jourIndex));
      // Heure de Paris explicite : le créneau saisi « 16:00 » doit rester
      // 16:00 à Paris, quel que soit le fuseau du navigateur.
      await api.adminPoserPermanence(
        new Date(`${j}T${heureDebut}:00+02:00`).toISOString(),
        new Date(`${j}T${heureFin}:00+02:00`).toISOString()
      );
      setAjoutJour(null);
      recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  async function retirer(id: string) {
    try {
      await api.adminRetirerPermanence(id);
      recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function dupliquer() {
    setEnCours(true);
    setErreur("");
    setMessage("");
    try {
      const r = await api.adminDupliquerPermanences(semaineISO);
      setMessage(
        `${r.copies} créneau${r.copies > 1 ? "x" : ""} recopié${r.copies > 1 ? "s" : ""}` +
          (r.ignores > 0 ? ` (${r.ignores} déjà posé${r.ignores > 1 ? "s" : ""})` : "")
      );
      recharger();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  const titreSemaine = lundi.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });

  return (
    <div>
      {/* La règle, affichée là où on pose les créneaux — c'est ici
          qu'un malentendu coûterait : elle croirait ses appels ouverts. */}
      <p className="rounded-xl bg-gold/10 px-4 py-2.5 text-xs leading-relaxed text-gold-dark">
        ✦ Ce calendrier n&apos;active jamais les appels — il annonce
        seulement vos permanences sur le site. Seul le bouton « Passer en
        ligne » ouvre la ligne.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLundi(new Date(lundi.getTime() - 7 * 86_400_000))}
            aria-label="Semaine précédente"
            className="rounded-full border border-greige/60 bg-white px-3 py-1.5 text-sm text-mention transition hover:text-aubergine"
          >
            ←
          </button>
          <span className="font-jakarta text-sm font-bold text-aubergine">
            Semaine du {titreSemaine}
          </span>
          <button
            type="button"
            onClick={() => setLundi(new Date(lundi.getTime() + 7 * 86_400_000))}
            aria-label="Semaine suivante"
            className="rounded-full border border-greige/60 bg-white px-3 py-1.5 text-sm text-mention transition hover:text-aubergine"
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={dupliquer}
          disabled={enCours}
          className="rounded-full border border-cta/40 bg-white px-4 py-1.5 text-xs font-bold text-prix transition hover:border-cta disabled:opacity-50"
        >
          ⟳ Dupliquer la semaine dernière
        </button>
      </div>

      {message && <p className="mt-2 text-sm text-green-700">{message}</p>}
      {erreur && <p className="mt-2 text-sm text-red-600">{erreur}</p>}

      <div className="mt-3 space-y-2">
        {JOURS.map((nom, i) => {
          const date = dateDuJourIndex(i);
          const jour = jourISO(date);
          const duJour = creneaux.filter(
            (c) => jourISO(new Date(c.debut)) === jour
          );
          return (
            <div
              key={nom}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-greige/50 bg-white px-4 py-2.5"
            >
              <span className="w-24 shrink-0">
                <span
                  className={`block text-sm font-bold ${
                    duJour.length > 0 ? "text-aubergine" : "text-mention/60"
                  }`}
                >
                  {nom}
                </span>
                <span className="block text-xs text-mention">
                  {date.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    timeZone: "Europe/Paris",
                  })}
                </span>
              </span>

              {duJour.map((c) => (
                <span
                  key={c.id}
                  className="inline-flex items-center gap-2 rounded-full border border-greige/60 bg-blush/60 px-3.5 py-1.5 text-sm font-semibold tabular-nums text-aubergine"
                >
                  {heure(c.debut)} – {heure(c.fin)}
                  <button
                    type="button"
                    onClick={() => retirer(c.id)}
                    aria-label="Supprimer ce créneau"
                    className="text-mention transition hover:text-red-600"
                  >
                    ✕
                  </button>
                </span>
              ))}

              {ajoutJour === i ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <select
                    value={heureDebut}
                    onChange={(e) => {
                      const d = e.target.value;
                      setHeureDebut(d);
                      // La fin suit si elle est devenue antérieure au début
                      if (heureFin <= d) {
                        const suivante = HEURES.find((h) => h > d);
                        if (suivante) setHeureFin(suivante);
                      }
                    }}
                    className="rounded-lg border border-greige/60 bg-white px-2 py-1.5 text-sm tabular-nums"
                    aria-label="Heure de début"
                  >
                    {HEURES.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-mention">→</span>
                  <select
                    value={heureFin}
                    onChange={(e) => setHeureFin(e.target.value)}
                    className="rounded-lg border border-greige/60 bg-white px-2 py-1.5 text-sm tabular-nums"
                    aria-label="Heure de fin"
                  >
                    {HEURES.filter((h) => h > heureDebut).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                  {libelleDuree(heureDebut, heureFin) && (
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
                      {libelleDuree(heureDebut, heureFin)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => poser(i)}
                    disabled={enCours}
                    className="rounded-full bg-cta px-3.5 py-1.5 text-xs font-bold text-cta-text disabled:opacity-50"
                  >
                    Poser
                  </button>
                  <button
                    type="button"
                    onClick={() => setAjoutJour(null)}
                    className="text-xs text-mention hover:text-aubergine"
                  >
                    annuler
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setAjoutJour(i)}
                  className="rounded-full border border-dashed border-greige px-3.5 py-1.5 text-xs font-bold text-mention transition hover:border-cta hover:text-prix"
                >
                  + créneau
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
