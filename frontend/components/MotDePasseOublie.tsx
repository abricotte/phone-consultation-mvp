"use client";

import { useState } from "react";
import { api } from "@/lib/api";

// MOT DE PASSE OUBLIÉ — par appel, pour tout le monde (clientes et
// praticienne). La plateforme n'envoie pas d'email : le téléphone
// enregistré sur le compte sonne et dicte un code à 4 chiffres, qu'on
// saisit ici avec le nouveau mot de passe. Qui tient ce téléphone peut
// le faire, personne d'autre — et chaque cliente a déjà un numéro, c'est
// celui que l'espace appelle pour consulter.
//
// S'insère sous un formulaire de connexion : il réutilise l'email saisi.

interface Props {
  email: string;
  /** Connexion réussie : jeton + utilisateur, à ranger par la page */
  onConnecte: (data: { token: string; user: unknown }) => void;
}

export default function MotDePasseOublie({ email, onConnecte }: Props) {
  const [etape, setEtape] = useState<"ferme" | "demande" | "code">("ferme");
  const [code, setCode] = useState("");
  const [mdp, setMdp] = useState("");
  const [mdp2, setMdp2] = useState("");
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function demanderCode() {
    setErreur("");
    setMessage("");
    if (!email.trim()) {
      setErreur("Indiquez d'abord votre email dans le formulaire, puis demandez le code.");
      return;
    }
    setEnCours(true);
    try {
      const r = await api.mdpDemander(email);
      setMessage(r.message);
      setEtape("code");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  async function confirmer(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (mdp !== mdp2) {
      setErreur("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setEnCours(true);
    try {
      const data = await api.mdpConfirmer({ email, code, nouveauMotDePasse: mdp });
      onConnecte(data);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  if (etape === "ferme") {
    return (
      <button
        type="button"
        onClick={() => setEtape("demande")}
        className="mt-4 text-xs text-mention underline decoration-greige underline-offset-4 hover:text-aubergine"
      >
        Mot de passe oublié ?
      </button>
    );
  }

  const champ = "w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink";

  return (
    <div className="mt-5 rounded-2xl bg-blush px-4 py-4">
      {etape === "demande" ? (
        <>
          <p className="text-sm font-semibold text-aubergine">Mot de passe oublié</p>
          <p className="mt-1 text-sm text-ink/80">
            Indiquez votre email ci-dessus : le téléphone de votre compte va
            sonner et vous dicter un code à 4 chiffres.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={demanderCode}
              disabled={enCours}
              className="rounded-full bg-aubergine px-5 py-2.5 text-sm font-semibold text-cream hover:bg-aubergine/90 disabled:opacity-50"
            >
              {enCours ? "Appel…" : "M'appeler avec le code"}
            </button>
            <button
              type="button"
              onClick={() => setEtape("ferme")}
              className="text-xs text-mention hover:text-aubergine"
            >
              annuler
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={confirmer} className="space-y-3">
          <p className="text-sm font-semibold text-aubergine">Nouveau mot de passe</p>
          {message && <p className="text-xs text-ink/80">{message}</p>}
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Code dicté au téléphone
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              required
              className="w-32 rounded-lg border border-greige bg-white px-3 py-2.5 text-center text-lg tracking-[0.3em] text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={mdp}
              onChange={(e) => setMdp(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className={champ}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Le même, une seconde fois
            </label>
            <input
              type="password"
              value={mdp2}
              onChange={(e) => setMdp2(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className={champ}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={enCours || code.length !== 4}
              className="rounded-full bg-cta px-5 py-2.5 text-sm font-semibold text-cta-text hover:bg-cta-dark disabled:opacity-50"
            >
              {enCours ? "Enregistrement…" : "Enregistrer et entrer"}
            </button>
            <button
              type="button"
              onClick={demanderCode}
              disabled={enCours}
              className="text-xs text-mention hover:text-aubergine"
            >
              pas de code reçu ? rappeler
            </button>
          </div>
        </form>
      )}
      {erreur && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{erreur}</p>
      )}
    </div>
  );
}
