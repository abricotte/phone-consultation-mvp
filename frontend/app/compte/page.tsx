"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface User {
  email: string;
  firstName: string;
  lastName: string;
}

export default function ComptePage() {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getMe()
      .then((u: User) => setUser(u))
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      })
      .finally(() => setChargement(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setErreur("");

    if (newPassword.length < 8) {
      setErreur("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErreur("Les deux nouveaux mots de passe ne correspondent pas.");
      return;
    }

    setEnCours(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setMessage("Votre mot de passe a bien été modifié.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setEnCours(false);
    }
  }

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
        Mon compte
      </h1>

      {/* Informations du compte */}
      <div className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Mes informations
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-mention">Nom</dt>
            <dd className="text-ink">
              {user?.firstName} {user?.lastName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-mention">Email</dt>
            <dd className="text-ink">{user?.email}</dd>
          </div>
        </dl>
        <p className="mt-4 text-xs text-mention">
          Pour modifier votre email ou votre numéro de téléphone, écrivez-nous
          à{" "}
          <a
            href="mailto:contact@elena-wolska.com"
            className="text-prix hover:underline"
          >
            contact@elena-wolska.com
          </a>
          .
        </p>
      </div>

      {/* Changer le mot de passe */}
      <div className="mt-6 rounded-2xl border border-greige/60 bg-ivory p-6 shadow-soft">
        <h2 className="font-serif text-xl font-semibold text-aubergine">
          Changer mon mot de passe
        </h2>

        {message && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            {message}
          </p>
        )}
        {erreur && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {erreur}
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Champ email caché : aide les gestionnaires de mots de passe */}
          <input
            type="email"
            value={user?.email || ""}
            autoComplete="username"
            readOnly
            hidden
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
            />
            <p className="mt-1 text-xs text-mention">Au moins 8 caractères.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-aubergine">
              Confirmer le nouveau mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
            />
          </div>
          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-full bg-cta py-3 font-medium text-cta-text hover:bg-cta-dark disabled:opacity-50"
          >
            {enCours ? "Modification…" : "Modifier mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}
