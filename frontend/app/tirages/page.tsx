"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import { Eventail } from "@/components/Ornements";

// MES TIRAGES — « Elena tire pour vous ». Deux tirages à la main, en deux
// colonnes, chacun avec son bouton « Je commande mon tirage » (Elena,
// 14 octobre). Le paiement sera relié à PayPal plus tard : d'ici là, le
// bouton dit comment commander. Décisions et prix : Elena, 12-14 octobre
// 2026 (docs/espace-cliente-mon-univers.md).

const PYTHIE = ["/images/pythie/la-vision.webp", "/images/pythie/le-grand-amour.webp", "/images/pythie/le-rendez-vous.webp"];
const LENORMAND = ["01-cavalier", "09-bouquet", "24-coeur", "29-femme", "31-soleil", "33-cle", "32-lune", "16-etoile"].map(
  (n) => `/images/lenormand/${n}.png`
);

function Tableau() {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-2xl bg-gradient-to-br from-gold/15 to-blush p-4">
      {LENORMAND.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt=""
          style={{ transform: `rotate(${[-2, 1.5, -1, 2, 1, -2, 1.5, -1][i]}deg)` }}
          className="w-full rounded-md shadow-[0_10px_24px_-12px_rgba(35,43,69,0.5)] ring-1 ring-white/70"
        />
      ))}
    </div>
  );
}

type Tirage = "pythie" | "grand_tableau";

export default function TiragesPage() {
  const [ouvert, setOuvert] = useState<Tirage | null>(null);
  const [question, setQuestion] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [recues, setRecues] = useState<{ type: Tirage; creeLe: string; statut: string }[]>([]);

  useEffect(() => {
    api.getCommandes().then((d: { commandes: { type: Tirage; creeLe: string; statut: string }[] }) => setRecues((d?.commandes ?? []).filter((c) => c.statut !== "annulee"))).catch(() => {});
  }, []);

  async function commander(type: Tirage) {
    setEnvoi(true); setErreur("");
    try {
      const d = await api.commanderTirage({ type, question: question.trim() || undefined });
      setRecues((r) => [{ type, creeLe: d.commande.creeLe, statut: d.commande.statut }, ...r]);
      setOuvert(null); setQuestion("");
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setEnvoi(false);
    }
  }

  function BoutonCommande({ quoi }: { quoi: Tirage }) {
    const derniere = recues.find((r) => r.type === quoi);
    return (
      <div className="mt-6">
        {derniere && (
          <p className="mb-3 rounded-[16px] border border-gold/30 bg-ivory px-4 py-3 text-[13px] leading-relaxed text-ink/80">
            <span className="mr-2 text-gold">✦</span>
            Commande reçue le {new Date(derniere.creeLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
            {derniere.statut === "livree" ? " · livrée" : derniere.statut === "en_cours" ? " · Elena s'y consacre" : " · Elena vous appellera pour le règlement"}.
          </p>
        )}
        {ouvert !== quoi ? (
          <button
            type="button"
            onClick={() => { setOuvert(quoi); setErreur(""); }}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-aubergine px-6 py-3 text-[14px] font-semibold text-cream hover:bg-aubergine/90"
          >
            Je commande mon tirage <span aria-hidden>→</span>
          </button>
        ) : (
          <div className="rounded-[20px] border border-gold/30 bg-ivory p-4">
            <label className="block text-[13px] font-semibold text-ink">
              {quoi === "pythie" ? "Votre question, pour les trois cartes" : "Ce que vous voulez que je regarde (facultatif)"}
              <textarea
                rows={3}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={2000}
                placeholder={quoi === "pythie" ? "Est-ce que je dois lui écrire ?" : "L'amour, le travail, cette personne…"}
                className="mt-2 w-full rounded-[14px] border border-greige bg-white px-3 py-2.5 text-[14px] font-normal text-ink"
              />
            </label>
            {erreur && <p className="mt-2 text-[13px] text-red-600">{erreur}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button type="button" disabled={envoi} onClick={() => commander(quoi)} className="rounded-full bg-aubergine px-5 py-2.5 text-[14px] font-semibold text-cream hover:bg-aubergine/90 disabled:opacity-50">
                {envoi ? "Envoi…" : "Envoyer ma commande"}
              </button>
              <button type="button" onClick={() => setOuvert(null)} className="text-[13px] text-mention hover:underline">Annuler</button>
            </div>
            <p className="mt-3 text-[12px] text-mention">Le paiement en ligne arrive. Elena reçoit votre commande dans son cabinet et vous appelle pour le règlement.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <EspaceShell>
      <header className="mb-10 max-w-2xl">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Elena tire pour vous
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Un tirage fait à la main, photographié, et une lecture écrite rien que pour vous — à lire, et
          relire.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── La Petite Pythie ── */}
        <section className="flex flex-col rounded-[28px] border border-[#EAD6DF] bg-[#F8EDF2] p-6 md:p-8">
          <div className="rounded-[22px] bg-white/50 px-4 pb-4 pt-8 ring-1 ring-white/70">
            <Eventail images={PYTHIE} taille={140} />
          </div>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Une question</p>
          <h2 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-aubergine">La Petite Pythie</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Mon oracle : trente-six cartes que j&apos;ai peintes à la main, consacrées à Delphes et à Délos.
            J&apos;en tire trois pour vous, sur la question qui vous occupe — une décision, une hésitation, un
            « est-ce que je dois ».
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Vous recevez la photo de vos trois cartes et une lecture d&apos;une à deux pages, sous trois jours.
          </p>
          <div className="mt-auto">
            <p className="mt-5 font-serif text-[34px] font-bold tabular-nums text-aubergine">55 €</p>
            <BoutonCommande quoi="pythie" />
          </div>
        </section>

        {/* ── Le Grand Tableau ── */}
        <section className="flex flex-col rounded-[28px] border border-[#EAD9B4] bg-[#FBF3E2] p-6 md:p-8">
          <div className="rounded-[22px] bg-white/50 p-4 ring-1 ring-white/70">
            <Tableau />
          </div>
          <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">
            Toute votre vie, en un regard
          </p>
          <h2 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-aubergine">
            Le Grand Tableau Lenormand
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
            Les trente-six cartes posées d&apos;un coup. On y lit l&apos;amour, le travail, l&apos;argent, le foyer,
            les personnes qui comptent, et les mois qui viennent. C&apos;est le tirage que l&apos;on fait une
            fois ou deux par an, aux moments où tout bascule.
          </p>
          <p className="mt-3 text-[14px] text-mention">
            Vous recevez la photo de votre tableau, une étude de trente à quarante pages avec vos questions
            et un sommaire — <span className="text-ink">et ma voix, qui vous la raconte</span>. Sous sept
            jours.
          </p>
          <p className="mt-4 text-[14px] text-ink">
            <span className="mr-2 text-gold">✦</span>
            <span className="font-semibold">Un seul tirage du Grand Tableau est effectué par semaine.</span>
          </p>
          <div className="mt-auto">
            <p className="mt-5 font-serif text-[34px] font-bold tabular-nums text-aubergine">149 €</p>
            <BoutonCommande quoi="grand_tableau" />
          </div>
        </section>
      </div>

      <p className="mt-8 font-serif text-lg italic text-mention">
        Avec chaque tirage, si vous le souhaitez :{" "}
        <span className="font-jakarta text-[14px] not-italic text-ink">
          « on en parle », vingt minutes au téléphone après lecture — 39 € au lieu de 58.
        </span>
      </p>
    </EspaceShell>
  );
}
