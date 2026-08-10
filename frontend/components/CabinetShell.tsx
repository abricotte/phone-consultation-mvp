"use client";

// Enveloppe visuelle du cabinet praticienne.
// Fond crème du site (et non blanc pur) : les cartes, blanches, gardent
// leur relief. La distinction avec l'espace cliente ne repose plus sur
// la couleur mais sur la structure : URL non référencée, porte de
// connexion dédiée, redirections par rôle.
export default function CabinetShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream font-jakarta">
      <div className="mx-auto max-w-4xl px-5 py-10">{children}</div>
    </div>
  );
}
