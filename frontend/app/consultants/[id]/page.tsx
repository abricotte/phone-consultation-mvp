"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface Consultant {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  description: string;
  ratePerMinute: number;
  isAvailable: boolean;
  rating: number;
  totalSessions: number;
}

export default function ConsultantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [consultant, setConsultant] = useState<Consultant | null>(null);
  const [loading, setLoading] = useState(true);
  const [callLoading, setCallLoading] = useState(false);
  const [callStatus, setCallStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getConsultant(id)
      .then(setConsultant)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleCall() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    setCallLoading(true);
    setCallStatus("");
    setError("");

    try {
      // 1. Créer la session
      const session = await api.createSession(id);
      setCallStatus("Session créée, lancement de l'appel...");

      // 2. Lancer l'appel Twilio
      const call = await api.initiateCall(session.id);
      setCallStatus(
        `Appel en cours ! Vous allez recevoir un appel sur votre téléphone. (Ref: ${call.callSid?.slice(-6)})`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'appel");
    } finally {
      setCallLoading(false);
    }
  }

  if (loading) return <div className="text-center mt-16">Chargement...</div>;
  if (error && !consultant)
    return <div className="text-center mt-16 text-red-600">{error}</div>;
  if (!consultant) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <a
        href="/consultants"
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Retour aux consultants
      </a>

      <div className="bg-white rounded-lg shadow-sm p-8 border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">
            {consultant.firstName} {consultant.lastName}
          </h1>
          <span
            className={`text-sm px-3 py-1 rounded-full ${
              consultant.isAvailable
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {consultant.isAvailable ? "Disponible" : "Indisponible"}
          </span>
        </div>

        <p className="text-blue-600 font-medium mb-2">
          {consultant.specialty}
        </p>
        <p className="text-gray-600 mb-6">
          {consultant.description || "Pas de description disponible."}
        </p>

        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">
              {consultant.ratePerMinute}€
            </p>
            <p className="text-sm text-gray-500">par minute</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">
              {consultant.rating.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">note</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-2xl font-bold text-gray-900">
              {consultant.totalSessions}
            </p>
            <p className="text-sm text-gray-500">consultations</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {callStatus && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-lg mb-4">
            {callStatus}
          </div>
        )}

        <button
          onClick={handleCall}
          disabled={!consultant.isAvailable || callLoading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {callLoading
            ? "Connexion en cours..."
            : consultant.isAvailable
            ? `Appeler (${consultant.ratePerMinute}€/min)`
            : "Consultant indisponible"}
        </button>

        <p className="text-xs text-gray-500 text-center mt-3">
          Minimum 5 minutes de solde requis. Vous serez facturé à la minute.
        </p>
      </div>
    </div>
  );
}
