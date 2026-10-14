// Test porté du site elena-wolska.com (ressources gratuites, page « amour-placebo »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const quizConfig: TestProfils = {
  mode: 'profils',
  slug: 'amour-placebo',
  title: 'Êtes-vous dans un amour placebo ?',
  subtitle:
    'Le lien que vous vivez est-il authentique, ou comble-t-il simplement un vide ?',
  tag: '8 Questions · 3 profils',

  intro: [
    'Certaines relations nous font du bien sans vraiment nous faire avancer. On s\'y sent en sécurité, on n\'est pas seul(e), on a quelqu\'un. Mais quelque chose, au fond, ne résonne pas vraiment juste.',
    'Ce test explore si ce que vous vivez est <strong>un lien authentique</strong>, ou une relation qui remplit un espace en attendant autre chose.',
    '<strong>Belle découverte !</strong>',
  ],

  fallbackCategory: 'A',

  spiritualMessage:
    'L\'amour véritable ne comble pas un vide. Il rencontre quelqu\'un qui est déjà entier. Ce que vous cherchez à l\'extérieur se trouve d\'abord en vous.',
  spiritualMessageFallback:
    'Votre profil ne fait pas ressortir une seule tendance claire. Vous êtes probablement à un carrefour, entre plusieurs réalités. C\'est le moment idéal pour vous poser les bonnes questions.',

  labels: {
    secondaryTitle: 'Votre tendance secondaire',
    secondaryDescription:
      'Cette dynamique est également présente dans votre relation. Elle peut nuancer votre profil principal et mérite d\'être observée.',
    profileTitle: 'Votre profil relationnel complet',
    ctaDescription:
      'Envie d\'y voir plus clair dans votre situation amoureuse ? Une consultation peut éclairer ce que vous ressentez.',
  },

  /* ── Les 8 questions ── */

  questions: [
    {
      title: 'Pourquoi êtes-vous dans cette relation ?',
      options: [
        { letter: 'A', text: 'Parce que cette personne m\'apporte quelque chose que je ne trouve nulle part ailleurs. Je la choisis vraiment.', category: 'A' },
        { letter: 'B', text: 'C\'est compliqué. Il y a des choses que j\'aime, mais je ne suis pas sûr(e) que ce soit vraiment ce que je veux.', category: 'B' },
        { letter: 'C', text: 'Honnêtement, parce que je n\'aime pas être seul(e). Ou parce que ça fait longtemps qu\'on est ensemble.', category: 'C' },
        { letter: 'D', text: 'Par habitude, par confort, ou parce que je ne sais pas comment partir.', category: 'C' },
      ],
    },
    {
      title: 'Comment vous sentez-vous avec vous-même depuis que vous êtes dans cette relation ?',
      options: [
        { letter: 'A', text: 'Mieux qu\'avant. Cette relation m\'a aidé(e) à m\'épanouir, à oser des choses.', category: 'A' },
        { letter: 'B', text: 'Pareil qu\'avant. Elle ne change pas grand chose à qui je suis.', category: 'B' },
        { letter: 'C', text: 'Moins bien. Je me suis un peu perdu(e) en chemin.', category: 'C' },
        { letter: 'D', text: 'Je ne me suis pas vraiment posé la question.', category: 'C' },
      ],
    },
    {
      title: 'Imaginez que cette personne disparaisse demain de votre vie. Qu\'est-ce que vous perdez vraiment ?',
      options: [
        { letter: 'A', text: 'Une personne unique, irremplaçable. Ce qu\'on partage ne ressemble à rien d\'autre.', category: 'A' },
        { letter: 'B', text: 'Une présence rassurante. Quelqu\'un à qui parler, quelqu\'un qui est là.', category: 'B' },
        { letter: 'C', text: 'Surtout la sécurité, la routine, l\'idée de ne pas être seul(e).', category: 'C' },
        { letter: 'D', text: 'Moins que ce que je voudrais admettre.', category: 'C' },
      ],
    },
    {
      title: 'Est-ce que vous vous sentez pleinement vu(e) et compris(e) par cette personne ?',
      options: [
        { letter: 'A', text: 'Oui. Elle me connaît vraiment, et ça me touche profondément.', category: 'A' },
        { letter: 'B', text: 'Partiellement. Elle connaît certaines facettes de moi, pas toutes.', category: 'B' },
        { letter: 'C', text: 'Pas vraiment. Je joue un rôle, ou je m\'efface pour que ça fonctionne.', category: 'C' },
        { letter: 'D', text: 'Non. Mais j\'ai arrêté d\'espérer que ce soit différent.', category: 'C' },
      ],
    },
    {
      title: 'Depuis que vous êtes dans cette relation, avez-vous mis de côté des choses importantes pour vous ?',
      options: [
        { letter: 'A', text: 'Non. Cette relation m\'a plutôt encouragé(e) à être moi-même, à poursuivre ce qui compte.', category: 'A' },
        { letter: 'B', text: 'Quelques choses, oui. Mais c\'est normal dans une relation, non ?', category: 'B' },
        { letter: 'C', text: 'Oui, plusieurs choses. Des amis, des projets, des envies. Progressivement.', category: 'C' },
        { letter: 'D', text: 'Presque tout. Je réalise que je ne me reconnais plus vraiment.', category: 'C' },
      ],
    },
    {
      title: 'Quand vous imaginez votre avenir idéal, cette personne y est-elle naturellement ?',
      options: [
        { letter: 'A', text: 'Oui, sans effort. Je ne me vois pas construire cet avenir sans elle.', category: 'A' },
        { letter: 'B', text: 'Parfois oui, parfois non. Ça dépend des jours.', category: 'B' },
        { letter: 'C', text: 'Je dois faire un effort pour l\'y inclure. Ce n\'est pas spontané.', category: 'C' },
        { letter: 'D', text: 'Non. Mais je n\'ose pas regarder cette pensée en face.', category: 'C' },
      ],
    },
    {
      title: 'Comment vous sentez-vous après avoir passé du temps avec cette personne ?',
      options: [
        { letter: 'A', text: 'Rechargé(e), apaisé(e), heureux(se). Sa présence me fait du bien.', category: 'A' },
        { letter: 'B', text: 'Neutre, ni vraiment mieux ni vraiment moins bien.', category: 'B' },
        { letter: 'C', text: 'Souvent fatigué(e), ou avec un vague sentiment de manque malgré sa présence.', category: 'C' },
        { letter: 'D', text: 'Soulagé(e) quand c\'est terminé, même si je culpabilise de le reconnaître.', category: 'C' },
      ],
    },
    {
      title: 'Si vous étiez certain(e) de ne jamais être seul(e), si la solitude n\'existait pas, seriez-vous encore dans cette relation ?',
      options: [
        { letter: 'A', text: 'Oui, sans hésiter. Ce n\'est pas la peur de la solitude qui me retient ici.', category: 'A' },
        { letter: 'B', text: 'Probablement, mais cette question me trouble un peu.', category: 'B' },
        { letter: 'C', text: 'Je ne suis pas sûr(e). Cette question me fait réaliser quelque chose.', category: 'C' },
        { letter: 'D', text: 'Honnêtement, non. Ou en tout cas, pas de la même façon.', category: 'C' },
      ],
    },
  ],

  /* ── Les 3 résultats ── */

  results: {
    A: {
      name: 'Un lien authentique',
      icon: 'heart',
      tagline: 'Ce que vous vivez est réel',
      description:
        'Ce que vous portez dans cette relation n\'est pas de la peur, pas de l\'habitude, pas du confort par défaut. C\'est un choix. Vous êtes là parce que cette personne compte vraiment, parce que ce lien vous apporte quelque chose que vous ne trouveriez pas ailleurs. Ce n\'est pas parfait. Aucune relation ne l\'est. Mais il y a quelque chose de juste dans ce que vous vivez : une réciprocité, une reconnaissance mutuelle, une présence qui vous fait du bien plutôt que du mal.',
      howItWorks:
        'Vous avez développé une capacité à choisir avec lucidité. Vous n\'êtes pas dans cette relation par peur de ce qui se passerait sans elle. Vous y êtes parce que vous le voulez vraiment. C\'est plus rare qu\'on ne le croit, et c\'est précieux.',
      signs: [
        'Vous êtes là par désir, pas par peur du vide',
        'Vous vous sentez épanoui(e) et reconnu(e) dans cette relation',
        'L\'autre vous encourage à être vous-même',
        'Vous imaginez naturellement votre avenir avec cette personne',
        'Sa présence vous recharge plutôt qu\'elle ne vous épuise',
      ],
      development: [
        'Continuer à nourrir ce lien consciemment',
        'Les relations authentiques ne se maintiennent pas seules, elles demandent une attention régulière',
        'Cultivez une communication honnête et la capacité à grandir ensemble',
      ],
      practices:
        'Prenez le temps de reconnaître ce que vous avez. Un lien authentique mérite d\'être célébré, pas seulement entretenu. Chaque jour, notez une chose que cette relation vous apporte et que vous ne trouveriez nulle part ailleurs.',
      affirmation:
        'Ce que je vis est réel, ancré et choisi. Je nourris ce lien avec conscience et gratitude.',
    },
    B: {
      name: 'La zone grise',
      icon: 'eye',
      tagline: 'Quelque chose ne se nomme pas encore',
      description:
        'Vous n\'êtes pas malheureux(se). Mais vous n\'êtes pas pleinement épanoui(e) non plus. Il y a quelque chose dans cette relation qui résiste à une définition claire. Ni vraiment juste, ni vraiment faux. Ni totalement choisi, ni totalement subi. La zone grise est inconfortable précisément parce qu\'elle ne donne pas de réponse simple. On ne peut pas partir sur un coup de tête, mais on ne peut pas non plus s\'y installer complètement sans se poser de questions.',
      howItWorks:
        'Vous êtes à un carrefour intérieur. Quelque chose en vous cherche à clarifier ce que vous voulez vraiment, au-delà de ce qui est rassurant, au-delà de ce qui est connu. Cette zone d\'inconfort n\'est pas un problème. C\'est un signal que quelque chose mérite d\'être regardé honnêtement.',
      signs: [
        'Vous n\'êtes ni vraiment mal ni pleinement épanoui(e)',
        'Vous avez du mal à définir clairement ce que vous ressentez',
        'Certains aspects de la relation vous conviennent, d\'autres vous pèsent',
        'Vous hésitez entre rester et partir sans jamais trancher',
        'La question "est-ce que c\'est vraiment ce que je veux ?" revient souvent',
      ],
      development: [
        'Ni précipitation ni évitement',
        'La zone grise demande du temps et de l\'honnêteté avec soi-même',
        'Posez-vous cette question : si cette relation était exactement la même dans cinq ans, seriez-vous en paix avec ça ?',
      ],
      practices:
        'Prenez un moment au calme et écrivez ce que cette relation vous apporte vraiment, puis ce qu\'elle vous coûte. Sans filtre, sans justification. La clarté commence souvent par des mots posés sur le papier.',
      affirmation:
        'Je m\'autorise à regarder ma situation avec honnêteté. La réponse viendra quand je serai prêt(e) à l\'entendre.',
    },
    C: {
      name: 'Un amour placebo',
      icon: 'sparkles',
      tagline: 'Ce lien comble quelque chose, mais ce n\'est pas ce que vous cherchez vraiment',
      description:
        'Ce que vous vivez n\'est pas sans valeur. Cette relation vous a apporté quelque chose : de la sécurité, de la présence, un rempart contre la solitude. Et c\'est humain, profondément humain, d\'avoir besoin de ça. Mais il y a une différence entre une relation qui nous nourrit et une relation qui comble temporairement un manque. La première nous fait avancer. La seconde nous maintient à l\'arrêt, confortablement immobiles, en attendant que quelque chose change, sans jamais vraiment créer les conditions pour que ça change. Un amour placebo n\'est pas une erreur. C\'est souvent une étape. Mais le reconnaître, c\'est déjà se redonner du pouvoir sur sa propre vie.',
      howItWorks:
        'Il y a en vous quelque chose qui aspire à plus : à un lien qui vous corresponde vraiment, à une relation dans laquelle vous n\'avez pas besoin de vous effacer ou de vous convaincre. Cette aspiration est juste. Elle mérite d\'être entendue plutôt qu\'étouffée par le confort de ce qui est déjà là.',
      signs: [
        'Vous restez par peur de la solitude plus que par désir',
        'Vous vous êtes perdu(e) dans cette relation',
        'L\'autre ne vous voit pas vraiment tel(le) que vous êtes',
        'Vous avez mis de côté des choses essentielles',
        'Sans la peur d\'être seul(e), vous ne seriez probablement pas là',
      ],
      development: [
        'Pas nécessairement partir, pas forcément rester',
        'Regarder honnêtement ce que cette relation vous coûte et ce qu\'elle vous apporte vraiment',
        'Commencer à vous demander ce dont vous avez besoin, pas ce qui est disponible, mais ce qui vous correspond vraiment',
      ],
      practices:
        'Ce travail commence à l\'intérieur. Chaque jour, faites une chose pour vous, rien que pour vous. Quelque chose qui vous rappelle qui vous êtes en dehors de cette relation. C\'est souvent là que tout commence à changer.',
      affirmation:
        'Je mérite un amour qui me correspond vraiment. Reconnaître ce qui ne me convient plus est un acte de courage, pas de faiblesse.',
    },
  },
};

const test: TestProfils | TestScore = quizConfig;
export default test;
