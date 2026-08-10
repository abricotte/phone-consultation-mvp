"use client";

// Enveloppe visuelle du cabinet praticienne.
// Fond nuit profond : impossible de confondre son cabinet avec l'espace
// cliente (fond crème). Les cartes restent claires et ressortent dessus.
export default function CabinetShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#161B2E] font-jakarta">
      <div className="mx-auto max-w-4xl px-5 py-10">{children}</div>
    </div>
  );
}
