"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { memeNumero } from "@/lib/format";

// RECHERCHE CLIENTE — sur l'accueil du cabinet.
//
// Le cas d'usage d'Elena : elle est en ligne avec une cliente, elle tape
// les premières lettres, Entrée, elle est sur la fiche. Rien d'autre.
// Pendant un appel, chaque seconde compte : pas de menu, pas de page
// intermédiaire, la première correspondance s'ouvre à Entrée.
//
// Cherche sur le prénom, le nom, l'email, et le numéro (comparé sur les
// chiffres seuls, quel que soit le format tapé). Six résultats maximum :
// au-delà, c'est qu'il faut taper une lettre de plus.

interface Cliente {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  nbConsultations: number;
}

export default function RechercheCliente() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [saisie, setSaisie] = useState("");
  const [surligne, setSurligne] = useState(0);
  const champ = useRef<HTMLInputElement>(null);

  // La liste est chargée une fois : le filtrage se fait au clavier, sans
  // aller-retour serveur à chaque lettre — instantané pendant l'appel.
  useEffect(() => {
    api
      .adminGetClientes()
      .then((c: Cliente[]) => setClientes(c || []))
      .catch(() => setClientes([]));
  }, []);

  const f = saisie.trim().toLowerCase();
  const chiffres = f.replace(/\D/g, "");
  const resultats =
    f.length < 2
      ? []
      : clientes
          .filter((c) => {
            const nomComplet = `${c.prenom} ${c.nom}`.toLowerCase();
            if (nomComplet.includes(f)) return true;
            if (c.email && c.email.toLowerCase().includes(f)) return true;
            // Numéro : au moins 4 chiffres tapés, comparés sur les chiffres
            if (chiffres.length >= 4 && c.telephone) {
              const tel = c.telephone.replace(/\D/g, "");
              if (tel.includes(chiffres) || memeNumero(c.telephone, saisie)) return true;
            }
            return false;
          })
          // Celles qui commencent par la saisie d'abord — c'est presque
          // toujours ce qu'on cherche quand on tape un prénom.
          .sort((a, b) => {
            const aDebut = a.prenom.toLowerCase().startsWith(f) ? 0 : 1;
            const bDebut = b.prenom.toLowerCase().startsWith(f) ? 0 : 1;
            return aDebut - bDebut || b.nbConsultations - a.nbConsultations;
          })
          .slice(0, 6);

  function ouvrir(c: Cliente) {
    window.location.href = `/cabinet-ew/clientes/${c.id}`;
  }

  function auClavier(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && resultats[surligne]) {
      e.preventDefault();
      ouvrir(resultats[surligne]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSurligne((i) => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSurligne((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setSaisie("");
      champ.current?.blur();
    }
  }

  return (
    <div className="relative mt-4">
      <input
        ref={champ}
        type="search"
        value={saisie}
        onChange={(e) => {
          setSaisie(e.target.value);
          setSurligne(0);
        }}
        onKeyDown={auClavier}
        placeholder="Trouver une cliente — prénom, email, numéro… puis Entrée"
        aria-label="Rechercher une cliente"
        autoComplete="off"
        className="w-full rounded-full border border-greige/60 bg-white px-5 py-3 text-sm text-ink placeholder:text-mention/70 focus:border-cta/50 focus:outline-none focus:ring-2 focus:ring-cta/10"
      />

      {resultats.length > 0 && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 z-20 mt-2 overflow-hidden rounded-2xl border border-greige/60 bg-white shadow-card"
        >
          {resultats.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === surligne}
              onMouseEnter={() => setSurligne(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // garde le focus le temps du clic
                ouvrir(c);
              }}
              className={`flex cursor-pointer items-center justify-between gap-3 px-5 py-2.5 text-sm ${
                i === surligne ? "bg-blush/70" : "hover:bg-blush/40"
              }`}
            >
              <span>
                <span className="font-bold text-aubergine">{c.prenom}</span>{" "}
                <span className="text-ink">{c.nom}</span>
                {c.email && (
                  <span className="ml-2 text-xs text-mention">{c.email}</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-mention">
                {c.nbConsultations > 0
                  ? `${c.nbConsultations} consult.`
                  : "jamais consulté"}
                {i === surligne && <span className="ml-2 text-prix">↵</span>}
              </span>
            </li>
          ))}
        </ul>
      )}

      {f.length >= 2 && resultats.length === 0 && (
        <p className="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-greige/60 bg-white px-5 py-3 text-sm text-mention shadow-card">
          Aucune cliente ne correspond à « {saisie} ».
        </p>
      )}
    </div>
  );
}
