// MA JOURNÉE — les textes. Écrits dans la voix d'Elena (directe, chaude,
// concrète, au « vous », des phrases courtes, des images de tous les
// jours : le téléphone, le soir, la maison). Ce sont des premières
// versions : Elena les relit et les remplace par les siens, un par un.
//
// La règle de la maison : la tonalité du jour vient d'un calcul sur la
// date de naissance et NE SE MONTRE JAMAIS à la cliente — ni chiffre, ni
// mot qui y renvoie. On parle du ciel (la Lune, Vénus, Mercure), jamais
// du nombre. Pas d'injonction sèche, pas de « à faire / à laisser ».

/** Neuf tonalités du jour, indexées 1–9. Deux à trois phrases, douces. */
export const TONALITES: Record<number, string> = {
  1: "Aujourd'hui, quelque chose commence, même petit. Un mot que vous n'aviez pas osé, une porte que vous poussez enfin. N'attendez pas que l'autre fasse le premier pas : ce jour-là est à vous.",
  2: "Une journée pour écouter plutôt que pour décider. Les choses se font à deux aujourd'hui, et dans la douceur. Si une réponse tarde, ce n'est pas un non. C'est le temps qui fait son travail.",
  3: "Parlez, écrivez, riez. Aujourd'hui, ce qui est dit avec légèreté passe mieux que ce qui a été pesé trop longtemps. Un message simple vaut mieux qu'un long silence.",
  4: "Une journée de terre. On range, on construit, on tient ce qu'on a promis. Pas de grand élan aujourd'hui, mais ce que vous posez restera.",
  5: "Ça bouge. Une journée qui n'aime pas les plans trop serrés. Laissez une place à l'imprévu, la rencontre, le coup de fil, la sortie. Ce qui arrive de côté aujourd'hui vaut souvent plus que ce qu'on avait prévu.",
  6: "Le cœur d'abord. Les vôtres, votre maison, les gestes qui prennent soin. C'est une journée où l'on donne, et où l'on peut aussi recevoir, si on ouvre les mains.",
  7: "Une journée pour vous. Moins de bruit, moins de monde. Ce que vous cherchez dehors depuis des jours se trouve peut-être dans un moment de calme, ce soir. Ne forcez rien.",
  8: "Les choses solides se construisent aujourd'hui, celles qu'on garde. Si une conversation d'argent, de maison ou d'engagement doit avoir lieu, elle tiendra. Prenez votre place, sans hausser le ton.",
  9: "Une journée de fin, et c'est une bonne nouvelle. Ce qui doit se terminer peut se terminer doucement : une attente, une rancune, un vieux message qu'on relit encore. Laissez partir, pour faire de la place.",
};

/** La Lune dans chaque signe : une phrase, dite à voix haute (le ciel, on peut le dire). Index 0 = Bélier. */
export const LUNES: string[] = [
  "La Lune en Bélier rend impatiente : ce qui vous brûle les lèvres, dites-le, mais une seule fois.",
  "La Lune en Taureau vous demande de ne rien précipiter ; elle aime ce qui dure.",
  "La Lune en Gémeaux fait parler tout le monde : c'est le jour des messages, des nouvelles, des deux conversations à la fois.",
  "La Lune en Cancer ramène à la maison et aux souvenirs ; la tendresse est à portée de main, la nostalgie aussi.",
  "La Lune en Lion a besoin de lumière : osez être vue, et offrez de la chaleur à qui en manque.",
  "La Lune en Vierge aime l'ordre et les petits soins ; un détail réglé, et le cœur respire.",
  "La Lune en Balance cherche l'accord : c'est un jour pour arrondir, pas pour trancher.",
  "La Lune en Scorpion creuse ; les émotions montent de loin, laissez-les passer sans tout dire.",
  "La Lune en Sagittaire donne envie d'air et d'ailleurs : une marche, un projet, un horizon.",
  "La Lune en Capricorne garde la tête froide ; ce qui compte aujourd'hui, c'est ce qu'on tient.",
  "La Lune en Verseau prend du recul : les amis, les idées, un pas de côté qui fait du bien.",
  "La Lune en Poissons rend perméable : les rêves parlent, la peau est fine, protégez-vous un peu.",
];

/** Les phases qui se sentent. */
export const PHASES = {
  nouvelle: "Et c'est la nouvelle lune : le bon jour pour poser un souhait, à voix basse.",
  pleine: "Et c'est la pleine lune : tout est un peu plus fort aujourd'hui, les larmes comme les élans.",
};

/** Les planètes qui reculent — calculées chaque jour, dites avec les mots d'Elena (son calendrier 2025-2026). */
export const RETROGRADES = {
  venus: "Vénus est rétrograde en ce moment : les histoires d'avant reviennent frapper, pour être terminées ou reprises autrement. Rien de neuf à signer, tout à relire.",
  mercure: "Mercure rétrograde, aussi : relisez avant d'envoyer, et ne prenez pas un silence pour une réponse.",
};

/** Un dernier mot pour son signe solaire. Index 0 = Bélier. */
export const SIGNES_MOT: string[] = [
  "Vous, Bélier, vous voudriez que tout aille plus vite. Pas aujourd'hui.",
  "Vous, Taureau, vous savez attendre. C'est votre force, pas votre faiblesse.",
  "Vous, Gémeaux, vous avez déjà deux réponses en tête. Choisissez la plus douce.",
  "Vous, Cancer, vous sentez tout avant les autres. Gardez-en un peu pour vous.",
  "Vous, Lion, vous n'avez pas à briller pour être aimée. Aujourd'hui, vous pouvez juste être là.",
  "Vous, Vierge, vous avez tout vérifié. Maintenant, laissez faire.",
  "Vous, Balance, vous cherchez la paix. Elle commence par vous.",
  "Vous, Scorpion, vous voyez clair, même quand c'est sombre. Faites-vous confiance.",
  "Vous, Sagittaire, vous avez envie de partir. Partez un peu, et revenez.",
  "Vous, Capricorne, vous tenez bon. Vous avez aussi le droit de poser les armes ce soir.",
  "Vous, Verseau, vous pensez loin. Ramenez une idée près du cœur.",
  "Vous, Poissons, vous rêvez juste. Notez ce que la nuit vous a dit.",
];
