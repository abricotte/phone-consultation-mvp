"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceNav from "@/components/EspaceNav";

interface User {
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role?: string;
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

  // Téléphone
  const [phone, setPhone] = useState("");
  const [phoneEnCours, setPhoneEnCours] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [phoneErreur, setPhoneErreur] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getMe()
      .then((u: User) => {
        // Espace réservé aux clientes : ici, la praticienne modifierait
        // le numéro de sa propre ligne professionnelle sans le savoir.
        if (u.role === "consultant" || u.role === "admin") {
          window.location.replace("/cabinet-ew");
          return;
        }
        setUser(u);
        setPhone(u.phone || "");
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      })
      .finally(() => setChargement(false));
  }, []);

  async function handlePhoneSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPhoneMessage("");
    setPhoneErreur("");
    setPhoneEnCours(true);
    try {
      const res = await api.changePhone(phone);
      setPhone(res.phone);
      setUser((u) => (u ? { ...u, phone: res.phone } : u));
      setPhoneMessage("Votre numéro de téléphone a bien été mis à jour.");
    } catch (err) {
      setPhoneErreur(
        err instanceof Error ? err.message : "Une erreur est survenue"
      );
    } finally {
      setPhoneEnCours(false);
    }
  }

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
    <div className="mx-auto max-w-2xl px-5 py-10 font-jakarta">
      <EspaceNav />

      <h1 className="mt-8 font-serif text-3xl font-semibold text-aubergine">
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

        {/* Numéro de téléphone (éditable) — c'est le numéro appelé lors des consultations */}
        <form onSubmit={handlePhoneSubmit} className="mt-5 border-t border-greige/50 pt-5">
          <label className="mb-1 block text-sm font-medium text-aubergine">
            Numéro de téléphone
          </label>
          <p className="mb-2 text-xs text-mention">
            C&apos;est le numéro qu&apos;Elena compose lors de vos consultations.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              autoComplete="tel"
              className="w-full rounded-lg border border-greige bg-white px-3 py-2.5 text-ink"
            />
            <button
              type="submit"
              disabled={phoneEnCours || phone.trim() === (user?.phone || "")}
              className="whitespace-nowrap rounded-full bg-cta px-5 py-2.5 font-medium text-cta-text hover:bg-cta-dark disabled:opacity-50"
            >
              {phoneEnCours ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
          {phoneMessage && (
            <p className="mt-2 rounded-lg bg-green-50 p-2 text-sm text-green-700">
              {phoneMessage}
            </p>
          )}
          {phoneErreur && (
            <p className="mt-2 rounded-lg bg-red-50 p-2 text-sm text-red-600">
              {phoneErreur}
            </p>
          )}
        </form>

        <p className="mt-4 text-xs text-mention">
          Pour modifier votre email, écrivez-nous à{" "}
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

      {/* Pas de carte vers le profil ici — une info, un seul endroit,
          sinon la cliente ne sait jamais où retourner pour modifier.
          Le profil a son onglet ; cette page reste ce que le système
          utilise : email, numéro, mot de passe. */}

      {/* L'historique des recharges et débits a quitté cette page pour
          « Mon crédit » : ici il était noyé entre l'adresse email et le
          mot de passe, et il n'avait rien à voir avec eux. On garde
          seulement le chemin qui y mène. */}
      <p className="mt-6 text-center text-sm text-mention">
        Vos recharges et le détail de vos consultations se trouvent dans{" "}
        <a href="/credit" className="text-prix hover:underline">
          Mon crédit
        </a>
        .
      </p>
    </div>
  );
}
