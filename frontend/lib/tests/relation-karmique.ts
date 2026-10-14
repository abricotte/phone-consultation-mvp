// Test porté du site elena-wolska.com (ressources gratuites, page « quizz-relation-karmique »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const quizConfig: TestScore = {
  mode: 'score',
  slug: 'relation-karmique',
  title: 'Suis-je dans une Relation Karmique ?',
  subtitle: 'Découvrez la nature profonde de votre lien amoureux',
  tag: 'Test Spirituel',

  intro: [
    '<strong>Une relation karmique n\u2019est pas une relation ordinaire.</strong>',
    'C\u2019est une rencontre destinée à vous faire grandir, souvent intense, magnétique, parfois douloureuse. Elle arrive pour libérer un n\u0153ud ancien, vous enseigner une leçon essentielle ou vous révéler une partie de vous-même.',
    '<em>Répondez aux 12 questions suivantes pour découvrir si vous êtes actuellement dans une relation karmique.</em>',
  ],
  questions: [
    {
      title: 'Comment décririez-vous votre première rencontre ?',
      options: [
        { icon: 'zap', text: 'Coup de foudre intense, sensation de déjà-vu, connexion immédiate', score: 3 },
        { icon: 'smile', text: 'Agréable et naturelle, mais sans intensité particulière', score: 1 },
        { icon: 'sprout', text: "Douce et progressive, l'attirance s'est construite avec le temps", score: 0 },
      ],
    },
    {
      title: "Avez-vous l'impression de connaître cette personne depuis toujours ?",
      options: [
        { icon: 'eye', text: "Oui, c'est troublant. Comme si on s'était déjà rencontrés dans une autre vie", score: 3 },
        { icon: 'help-circle', text: 'Parfois, mais je ne saurais pas dire pourquoi', score: 1 },
        { icon: 'cloud', text: 'Non, je découvre cette personne progressivement', score: 0 },
      ],
    },
    {
      title: "Comment qualifieriez-vous l'intensité émotionnelle de cette relation ?",
      options: [
        { icon: 'tornado', text: "Des hauts très hauts et des bas très bas, c'est épuisant mais addictif", score: 3 },
        { icon: 'activity', text: 'Variable, avec des moments de tension mais gérable', score: 1 },
        { icon: 'waves', text: 'Stable et apaisante, nous gérons nos émotions sainement', score: 0 },
      ],
    },
    {
      title: 'Cette relation vous pousse-t-elle à affronter vos blessures passées ?',
      options: [
        { icon: 'flame', text: 'Oui, elle réveille systématiquement mes anciennes douleurs', score: 3 },
        { icon: 'sparkles', text: 'Parfois, certaines situations font remonter des choses', score: 1 },
        { icon: 'flower', text: "Non, cette relation me soigne et m'apaise", score: 0 },
      ],
    },
    {
      title: 'Arrivez-vous à vous détacher facilement de cette personne ?',
      options: [
        { icon: 'link', text: "Non, c'est comme un aimant. Même quand je veux partir, je reviens", score: 3 },
        { icon: 'help-circle', text: "C'est difficile mais je pourrais si nécessaire", score: 1 },
        { icon: 'bird', text: 'Je me sens libre dans cette relation, pas dépendant(e)', score: 0 },
      ],
    },
    {
      title: 'Cette relation vous fait-elle évoluer spirituellement ?',
      options: [
        { icon: 'sparkles', text: 'Oui, de façon brutale. Je change profondément, parfois malgré moi', score: 3 },
        { icon: 'star', text: "Oui, elle m'apporte des prises de conscience", score: 1 },
        { icon: 'sun', text: 'On évolue ensemble, en douceur et dans la même direction', score: 0 },
      ],
    },
    {
      title: "Avez-vous l'impression de répéter un schéma relationnel ?",
      options: [
        { icon: 'repeat', text: 'Oui, comme si je rejouais une scène déjà vécue', score: 3 },
        { icon: 'drama', text: 'Certains aspects me rappellent des relations passées', score: 1 },
        { icon: 'sparkle', text: 'Non, cette relation est nouvelle et différente', score: 0 },
      ],
    },
    {
      title: 'La communication est-elle facile avec cette personne ?',
      options: [
        { icon: 'bomb', text: "Non, c'est compliqué. On se comprend sans mots mais on se dispute souvent", score: 3 },
        { icon: 'message-circle', text: 'Variable, parfois fluide, parfois difficile', score: 1 },
        { icon: 'heart-handshake', text: 'Oui, on communique sainement et avec respect', score: 0 },
      ],
    },
    {
      title: 'Cette relation impacte-t-elle fortement votre vie quotidienne ?',
      options: [
        { icon: 'orbit', text: "Oui, elle occupe toutes mes pensées, c'est bouleversant", score: 3 },
        { icon: 'scale', text: 'Elle a un impact mais je garde mes autres priorités', score: 1 },
        { icon: 'sun', text: "Elle s'intègre harmonieusement dans ma vie", score: 0 },
      ],
    },
    {
      title: "Y a-t-il un sentiment d'urgence ou de destin dans cette rencontre ?",
      options: [
        { icon: 'alarm-clock', text: "Oui, comme si on devait se rencontrer maintenant, c'était écrit", score: 3 },
        { icon: 'help-circle', text: 'Parfois je me pose la question', score: 1 },
        { icon: 'leaf', text: 'Non, je vis cette relation au présent, sans pression', score: 0 },
      ],
    },
    {
      title: 'Cette personne vous renvoie-t-elle comme un miroir ?',
      options: [
        { icon: 'flip-horizontal-2', text: "Oui, elle reflète mes parts d'ombre que je ne veux pas voir", score: 3 },
        { icon: 'eye', text: 'Parfois, certains comportements me font réfléchir sur moi', score: 1 },
        { icon: 'flower', text: 'Elle me révèle mes qualités et me fait grandir positivement', score: 0 },
      ],
    },
    {
      title: 'Sentez-vous que cette relation a une "mission" ou une leçon à vous enseigner ?',
      options: [
        { icon: 'book-open', text: "Absolument, je sens qu'il y a quelque chose à comprendre ou libérer", score: 3 },
        { icon: 'cloud', text: 'Peut-être, je me pose des questions', score: 1 },
        { icon: 'heart', text: "Non, c'est simplement une belle relation d'amour", score: 0 },
      ],
    },
  ],
  resultRanges: [
    {
      minScore: 24,
      result: {
        icon: 'flame',
        title: 'Oui, vous êtes dans une Relation Karmique',
        subtitle: 'Intense et transformatrice',
        description:
          "Votre score indique une relation karmique claire. Cette rencontre n'est pas un hasard : elle vous pousse à évoluer, parfois douloureusement, toujours profondément. Vous êtes ici pour libérer un n\u0153ud ancien, apprendre une leçon essentielle ou guérir une blessure que vous portez depuis longtemps.",
        signs: [
          'Connexion magnétique et irrésistible dès la première rencontre',
          'Montagnes russes émotionnelles : passion intense et conflits récurrents',
          "Sentiment de déjà-vu, comme si vous vous connaissiez d'une autre vie",
          'Cette relation réveille vos blessures les plus profondes',
          "Impossibilité de partir vraiment, même quand c'est douloureux",
          'Transformation spirituelle rapide et souvent brutale',
          'Répétition de schémas relationnels que vous pensiez avoir dépassés',
        ],
        advice: [
          {
            title: 'Comprenez la leçon',
            text: "Demandez-vous : qu'est-ce que cette relation vient m'enseigner ? Quelle part de moi dois-je guérir ou accepter ?",
          },
          {
            title: 'Ne restez pas par attachement',
            text: "Une relation karmique n'est pas toujours destinée à durer. Si elle devient toxique, la leçon est peut-être d'apprendre à partir.",
          },
          {
            title: 'Travaillez sur vous',
            text: 'Faites un travail intérieur profond : thérapie, écriture, méditation. Cette relation est un miroir, utilisez-le.',
          },
          {
            title: 'Posez des limites',
            text: 'Même dans une relation karmique, vous avez le droit de protéger votre énergie et de dire non.',
          },
        ],
      },
    },
    {
      minScore: 12,
      result: {
        icon: 'sparkles',
        title: "Présence d'Éléments Karmiques",
        subtitle: 'Connexion significative avec leçons à intégrer',
        description:
          "Votre relation présente des aspects karmiques sans être entièrement définie par cela. Il y a une connexion profonde et des leçons à apprendre, mais l'intensité reste gérable. Cette personne est dans votre vie pour une raison, même si le chemin reste plus doux qu'une relation purement karmique.",
        signs: [
          'Connexion forte mais pas dévorante',
          'Certaines situations réveillent des blessures anciennes',
          'Impression parfois troublante de familiarité',
          'Évolution personnelle grâce à cette relation',
          'Quelques schémas répétitifs mais conscientisés',
          'Communication parfois difficile mais améliorable',
        ],
        advice: [
          {
            title: 'Restez conscient(e)',
            text: "Observez les schémas qui se répètent et les émotions qui remontent. Qu'ont-ils à vous dire ?",
          },
          {
            title: 'Communiquez ouvertement',
            text: 'Partagez vos ressentis avec votre partenaire. La conscience partagée transforme.',
          },
          {
            title: "Cultivez l'équilibre",
            text: 'Gardez votre indépendance, vos passions et votre cercle social. Ne vous perdez pas dans cette relation.',
          },
          {
            title: 'Intégrez les leçons',
            text: "Chaque difficulté est une opportunité d'évolution. Accueillez-les comme des enseignements.",
          },
        ],
      },
    },
    {
      minScore: 0,
      result: {
        icon: 'heart',
        title: "Relation d'Âme Saine",
        subtitle: 'Connexion harmonieuse et évolutive',
        description:
          "Votre relation ne présente pas les signes d'un lien karmique intense. C'est une belle rencontre, peut-être une âme s\u0153ur, qui vous accompagne avec douceur sur votre chemin. Vous évoluez ensemble dans l'harmonie, sans les turbulences caractéristiques d'une relation karmique.",
        signs: [
          'Communication fluide et respectueuse',
          'Évolution douce et harmonieuse à deux',
          'Sentiment de sécurité et de liberté',
          'Absence de dépendance émotionnelle',
          'Pas de répétition de schémas toxiques',
          'Relation nourrissante qui vous fait grandir positivement',
        ],
        advice: [
          {
            title: 'Cultivez la gratitude',
            text: "Vous avez la chance d'être dans une relation saine. Prenez le temps d'apprécier cette belle connexion.",
          },
          {
            title: 'Continuez à grandir ensemble',
            text: "Même sans karma à résoudre, continuez d'évoluer en conscience et en complicité.",
          },
          {
            title: 'Restez authentique',
            text: "Préservez votre individualité tout en nourrissant votre lien. L'équilibre est la clé.",
          },
          {
            title: 'Partagez votre lumière',
            text: "Votre relation harmonieuse peut inspirer d'autres. Soyez un exemple de ce qu'est l'amour sain.",
          },
        ],
      },
    },
  ],
};

const test: TestProfils | TestScore = quizConfig;
export default test;
