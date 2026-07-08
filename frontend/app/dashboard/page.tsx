"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import RechargeSelector from "@/components/RechargeSelector";
import AppelElenaCard from "@/components/AppelElenaCard";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface Wallet {
  balance: number;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    // Vérifier le retour de Stripe
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setPaymentStatus("Paiement effectué avec succès ! Votre solde sera mis à jour sous peu.");
      window.history.replaceState({}, "", "/dashboard");
    } else if (params.get("payment") === "cancel") {
      setPaymentStatus("Paiement annulé.");
      window.history.replaceState({}, "", "/dashboard");
    }

    Promise.all([api.getMe(), api.getWallet(), api.getTransactions()])
      .then(([userData, walletData, txData]) => {
        setUser(userData);
        setWallet(walletData);
        setTransactions(txData);
      })
      .catch((err) => {
        setError(err.message);
        if (err.message.includes("Token")) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  }

  if (loading) return <div className="text-center mt-16">Chargement...</div>;
  if (error && !user)
    return <div className="text-center mt-16 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-2xl font-semibold text-aubergine">
          Bonjour {user?.firstName} {user?.lastName}
        </h1>
        <div className="flex items-center gap-4 text-sm">
          <a href="/compte" className="text-mention hover:text-cta">
            Mon compte
          </a>
          <button
            onClick={handleLogout}
            className="text-mention hover:text-red-600"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {paymentStatus && (
        <div className={`p-4 rounded-lg mb-6 ${paymentStatus.includes("succès") ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
          {paymentStatus}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Appel immédiat — action principale, en haut de l'espace cliente */}
      <div className="mb-6">
        <AppelElenaCard />
      </div>

      {/* Portefeuille */}
      <div className="bg-ivory rounded-2xl shadow-soft p-6 mb-6 border border-greige/60">
        <h2 className="text-lg font-semibold mb-4">Mon portefeuille</h2>
        <p className="font-serif text-3xl font-semibold text-prix mb-4">
          {wallet?.balance?.toFixed(2) ?? "0.00"}€
        </p>
        <RechargeSelector />
      </div>

      {/* Historique des transactions */}
      <div className="bg-ivory rounded-2xl shadow-soft p-6 border border-greige/60">
        <h2 className="text-lg font-semibold mb-4">
          Historique des transactions
        </h2>
        {transactions.length === 0 ? (
          <p className="text-gray-600">Aucune transaction pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`font-bold ${
                    tx.type === "credit" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {tx.type === "credit" ? "+" : "-"}
                  {tx.amount.toFixed(2)}€
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
