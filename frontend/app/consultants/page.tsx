"use client";

import { useEffect, useState } from "react";
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

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getConsultants()
      .then(setConsultants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-16">Chargement...</div>;
  if (error)
    return <div className="text-center mt-16 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Nos consultants</h1>

      {consultants.length === 0 ? (
        <p className="text-gray-600">Aucun consultant disponible pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg shadow-sm p-6 border"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">
                  {c.firstName} {c.lastName}
                </h2>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    c.isAvailable
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {c.isAvailable ? "Disponible" : "Indisponible"}
                </span>
              </div>
              <p className="text-sm text-blue-600 mb-2">{c.specialty}</p>
              <p className="text-sm text-gray-600 mb-4">
                {c.description || "Pas de description"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">
                  {c.ratePerMinute}€/min
                </span>
                <a
                  href={`/consultants/${c.id}`}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Consulter
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
