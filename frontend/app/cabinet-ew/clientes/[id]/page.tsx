"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { api } from "@/lib/api";
import CabinetNav from "@/components/CabinetNav";
import CabinetShell from "@/components/CabinetShell";
import {
  signeAstrologique,
  formatDateNaissance,
  signeParCode,
} from "@/lib/astro";

interface ProcheFiche {
  prenom: string;
  dateNaissance: string | null;
  ascendant: string | null;
  lien: string;
}

interface ConsultationFiche {
  id: string;
  date: string;
  formule: string;
  issue: string;
  dureeSecondes: number;
  montant: number;
}

interface RechargeFiche {
  date: string;
  montant: number;
  description: string;
}

interface Fiche {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  inscriteLe: string;
  dateNaissance: string | null;
  ascendant: string | null;
  solde: number;
  totalDepense: number;
  proches: ProcheFiche[];
  consultations: ConsultationFiche[];
  recharges: RechargeFiche[];
}

const LIEN_LABELS: Record<string, string> = {
  compagnon: "Compagnon / compagne",
  ex: "Ex",
  mere: "Mère",
  pere: "Père",
  enfant: "Enfant",
  ami: "Ami(e)",
  autre: "Autre",
};

function formatDuree(s: number): string {
  if (!s || s <= 0) return "—";
  const min = Math.floor(s / 60);
  const sec = s % 60;
  if (min === 0) return `${sec} s`;
  return sec > 0 ? `${min} min ${sec.toString().padStart(2, "0")}` : `${min} min`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function euros(n: number): string {
  return `${n.toFixed(2).replace(".", ",")} €`;
}

// +33612345678 → 06 12 34 56 78
function formatTel(t: string | null): string {
  if (!t) return "—";
  const fr = t.replace(/^\+33/, "0");
  return /^0\d{9}$/.test(fr) ? fr.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : t;
}

export default function FicheClientePage() {
  const params = useParams<{ id: string }>();
  const [fiche, setFiche] = useState<Fiche | null>(null);
  const [loading, setLoading] = useState(true);
  const [accesRefuse, setAccesRefuse] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.replace("/cabinet-ew");
      return;
    }
    api
      .adminGetCliente(params.id)
      .then((data: Fiche) => setFiche(data))
      .catch(() => setAccesRefuse(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading)
    return <div className="mt-16 text-center text-mention">Chargement…</div>;
  if (accesRefuse || !fiche) notFound();

  const signe = signeAstrologique(fiche.dateNaissance);
  const asc = signeParCode(fiche.ascendant);

  // Indicateurs de fidélité — calculés sur ses consultations facturées
  const facturees = fiche.consultations.filter(
    (c) => c.issue === "terminee" && c.montant > 0
  );
  const panierMoyen = facturees.length
    ? facturees.reduce((acc, c) => acc + c.montant, 0) / facturees.length
    : 0;
  const tenues = fiche.consultations.filter(
    (c) => c.issue === "terminee" || c.issue === "non_facturee"
  );
  const minutesTotales = Math.round(
    tenues.reduce((acc, c) => acc + c.dureeSecondes, 0) / 60
  );
  const dureeMoyenne = tenues.length ? Math.round(minutesTotales / tenues.length) : 0;
  // Sa première consultation (les plus récentes arrivent en premier)
  const premiere = tenues.length ? tenues[tenues.length - 1].date : null;

  return (
    <CabinetShell>
      <CabinetNav />

      <a
        href="/cabinet-ew/clientes"
        className="mt-8 inline-block text-sm font-medium text-prix transition-colors hover:text-cta"
      >
        ← Toutes les clientes
      </a>

      {/* Identité + ciel */}
      <section className="relative mt-4 overflow-hidden rounded-3xl border border-greige/60 bg-gradient-to-br from-blush via-cream to-cream p-7 shadow-soft">
        <span aria-hidden className="pointer-events-none absolute right-8 top-6 text-lg text-gold/50">✦</span>
        <span aria-hidden className="pointer-events-none absolute right-16 top-14 text-xs text-coral/40">✦</span>

        <div className="flex items-center gap-5">
          <div
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-4xl ring-1 ${
              signe
                ? "bg-gradient-to-br from-gold-light to-gold text-aubergine ring-gold-dark/30"
                : "bg-greige/40 text-mention ring-greige"
            }`}
          >
            {signe ? signe.emoji : fiche.prenom.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-semibold text-aubergine">
              {fiche.prenom} {fiche.nom}
            </h1>
            {signe ? (
              <p className="mt-0.5 text-sm text-ink">
                {signe.emoji} {signe.nom}
                {asc && ` · ascendant ${asc.nom}`}
                {fiche.dateNaissance &&
                  ` · née le ${formatDateNaissance(fiche.dateNaissance)}`}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-mention">
                Date de naissance non renseignée.
              </p>
            )}
            <p className="mt-1 text-xs text-mention">
              Cliente depuis le {formatDate(fiche.inscriteLe)}
            </p>
          </div>
        </div>

        {/* Contact + chiffres clés */}
        <div className="mt-5 grid gap-4 border-t border-greige/50 pt-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-mention">Téléphone : </span>
              {fiche.telephone ? (
                <a
                  href={`tel:${fiche.telephone}`}
                  className="font-medium text-prix hover:underline"
                >
                  {formatTel(fiche.telephone)}
                </a>
              ) : (
                <span className="text-mention">—</span>
              )}
            </p>
            <p className="truncate">
              <span className="text-mention">Email : </span>
              {fiche.email ? (
                <a
                  href={`mailto:${fiche.email}`}
                  className="font-medium text-prix hover:underline"
                >
                  {fiche.email}
                </a>
              ) : (
                <span className="text-mention">—</span>
              )}
            </p>
          </div>
          <div className="flex gap-6 sm:justify-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Crédit
              </p>
              <p className="font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {euros(fiche.solde)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Total dépensé
              </p>
              <p className="font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {euros(fiche.totalDepense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Indicateurs de fidélité — pour toi seule */}
      {tenues.length > 0 && (
        <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-6 shadow-soft">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Panier moyen
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {euros(panierMoyen)}
              </p>
              <p className="text-xs text-mention">
                sur {facturees.length} consultation{facturees.length > 1 ? "s" : ""}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Consultations
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {tenues.length}
              </p>
              <p className="text-xs text-mention">
                {premiere ? `depuis le ${formatDate(premiere)}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Temps d&apos;écoute
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {minutesTotales}
                <span className="ml-1 text-base font-normal text-mention">min</span>
              </p>
              <p className="text-xs text-mention">{dureeMoyenne} min par appel</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mention">
                Recharges
              </p>
              <p className="mt-0.5 font-serif text-2xl font-semibold tabular-nums text-aubergine">
                {fiche.recharges.length}
              </p>
              <p className="text-xs text-mention">
                {euros(
                  fiche.recharges.reduce((acc, r) => acc + r.montant, 0)
                )}{" "}
                au total
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Les personnes qui comptent */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Les personnes qui comptent
        </h2>
        {fiche.proches.length === 0 ? (
          <p className="mt-3 text-sm text-mention">
            Aucun proche renseigné pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {fiche.proches.map((p, i) => {
              const s = signeAstrologique(p.dateNaissance);
              const a = signeParCode(p.ascendant);
              return (
                <li
                  key={i}
                  className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl border border-greige/50 bg-cream px-4 py-2.5"
                >
                  <span className="font-medium text-ink">{p.prenom}</span>
                  <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs text-mention">
                    {LIEN_LABELS[p.lien] || "Autre"}
                  </span>
                  <span className="text-xs text-mention">
                    {[
                      p.dateNaissance ? formatDateNaissance(p.dateNaissance) : null,
                      s ? `${s.emoji} ${s.nom}` : null,
                      a ? `asc. ${a.nom}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Historique des consultations */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Ses consultations
        </h2>
        {fiche.consultations.length === 0 ? (
          <p className="mt-3 text-sm text-mention">
            Aucune consultation pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4">
            {fiche.consultations.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-greige/40 py-3 last:border-0"
              >
                <span className="w-40 shrink-0 text-sm text-mention">
                  {formatDate(c.date)}
                </span>
                <span className="text-sm text-ink">{c.formule}</span>
                <span className="text-sm text-mention">
                  {formatDuree(c.dureeSecondes)}
                </span>
                <span className="ml-auto">
                  {c.issue === "terminee" && c.montant > 0 ? (
                    <span className="font-bold tabular-nums text-aubergine">
                      {euros(c.montant)}
                    </span>
                  ) : c.issue === "non_facturee" ? (
                    <span className="rounded-full bg-blush px-2.5 py-0.5 text-xs text-mention">
                      Non facturé
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                      Manqué
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Ses recharges */}
      <section className="mt-5 rounded-3xl border border-greige/40 bg-ivory p-7 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Ses recharges
        </h2>
        {fiche.recharges.length === 0 ? (
          <p className="mt-3 text-sm text-mention">
            Aucune recharge pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-4">
            {fiche.recharges.map((r, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-greige/40 py-3 last:border-0"
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-statut-online"
                >
                  ＋
                </span>
                <span className="w-40 shrink-0 text-sm text-mention">
                  {formatDate(r.date)}
                </span>
                <span className="text-sm text-ink">{r.description}</span>
                <span className="ml-auto font-bold tabular-nums text-statut-online">
                  +{euros(r.montant)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </CabinetShell>
  );
}
