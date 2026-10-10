import { Icone } from "@/components/IconesEspace";

// CE QUE JE VEUX ABORDER — la tuile D de l'accueil. Elle répond à
// « Qu'est-ce que je veux lui dire ? »
//
// Lecture seule ici : on ne duplique pas le formulaire, « Modifier »
// mène à la section de Profil. La donnée existe déjà (profil.aAborder).
// Jamais d'état vide silencieux : sans texte, l'encadré invite.

export default function TuileAborder({ texte }: { texte: string }) {
  const vide = !texte.trim();
  return (
    <section className="flex h-full flex-col rounded-3xl border border-greige bg-ivory p-5 md:p-7">
      <h2 className="font-serif text-2xl font-semibold text-aubergine">
        Ce que je veux aborder
      </h2>

      <div className="mt-3 rounded-2xl border border-greige bg-cream p-3.5 text-sm leading-[1.55] text-ink">
        {vide ? (
          <p className="italic text-mention">
            Rien pour l&apos;instant — notez ici ce que vous voulez lui dire.
          </p>
        ) : (
          <p className="line-clamp-4 whitespace-pre-line">{texte}</p>
        )}
      </div>

      <p className="mt-2 text-xs text-mention">
        Elena le lit avant de vous appeler. Personne d&apos;autre.
      </p>

      <a
        href="/profil#aborder"
        className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 self-start pt-3 text-sm font-semibold text-prix hover:underline"
      >
        <Icone nom="modifier" taille={16} />
        {vide ? "Écrire" : "Modifier"}
      </a>
    </section>
  );
}
