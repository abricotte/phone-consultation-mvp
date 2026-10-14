// Test porté du site elena-wolska.com (ressources gratuites, page « quel-amour-vous-attend »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const quizConfig: TestProfils = {
  mode: 'profils',
  slug: 'quel-amour-vous-attend',
  title: 'Quel Amour Vous Attend ?',
  subtitle:
    'Découvrez le type d\'amour qui se prépare pour vous',
  tag: '9 Questions · 5 min',

  intro: [
    'Ce quizz éclaire ce que vous traversez et <strong>le type d\'amour qui correspond à votre état intérieur actuel</strong>. Car c\'est souvent de l\'intérieur que l\'amour commence.',
    '<strong>Belle découverte !</strong>',
  ],

  fallbackCategory: 'A',

  spiritualMessage:
    'L\'amour qui vient n\'est pas toujours celui qu\'on attendait. Mais il est souvent celui dont on avait besoin. Faites confiance à ce que votre coeur sait déjà.',
  spiritualMessageFallback:
    'Votre profil ne fait pas ressortir un seul type d\'amour — et c\'est une richesse. Vous êtes à un carrefour, ouverte à plusieurs formes d\'amour. Ce qui vient à vous saura prendre la forme exacte dont votre coeur a besoin.',

  labels: {
    secondaryTitle: 'Votre tendance secondaire',
    secondaryDescription:
      'Cette dynamique est également présente en vous. Elle peut se combiner avec votre profil principal et nuancer la façon dont l\'amour se présentera dans votre vie.',
    profileTitle: 'Votre profil amoureux complet',
    ctaDescription:
      'Envie de savoir plus précisément ce qui se prépare dans votre vie sentimentale ? Une consultation peut éclairer votre situation actuelle.',
  },

  /* ── Les 9 questions ── */

  questions: [
    {
      title: 'Comment décririez-vous votre rapport à l\'amour en ce moment ?',
      options: [
        { letter: 'A', text: 'Je n\'y pense presque plus. Je vis, et c\'est bien ainsi.', category: 'A' },
        { letter: 'B', text: 'J\'en ai envie, mais j\'ai besoin que ça soit solide avant de m\'ouvrir.', category: 'B' },
        { letter: 'C', text: 'Je sens que quelque chose en moi est en train de changer profondément.', category: 'C' },
        { letter: 'D', text: 'Je me remets doucement d\'une période difficile. Je cicatrise.', category: 'D' },
        { letter: 'E', text: 'Je me sens à l\'étroit dans ma vie actuelle. J\'ai besoin d\'air.', category: 'E' },
      ],
    },
    {
      title: 'Quand vous imaginez une relation amoureuse, qu\'est-ce qui vous attire le plus ?',
      options: [
        { letter: 'A', text: 'Une rencontre qui surgit de nulle part, sans qu\'on l\'ait cherchée.', category: 'A' },
        { letter: 'B', text: 'Quelque chose de stable, qui se construit pas à pas, sans précipitation.', category: 'B' },
        { letter: 'C', text: 'Une histoire qui me bouscule et me révèle à moi-même.', category: 'C' },
        { letter: 'D', text: 'Une présence douce qui me redonne confiance en l\'autre.', category: 'D' },
        { letter: 'E', text: 'Quelqu\'un qui m\'ouvre de nouveaux horizons, de nouvelles façons d\'être.', category: 'E' },
      ],
    },
    {
      title: 'Comment vous sentez-vous par rapport à vos relations passées aujourd\'hui ?',
      options: [
        { letter: 'A', text: 'Je les ai intégrées. Elles font partie de moi, sans peser.', category: 'A' },
        { letter: 'B', text: 'Elles m\'ont appris à être prudent(e). Je ne veux plus souffrir.', category: 'B' },
        { letter: 'C', text: 'Elles m\'ont mis(e) face à des choses sur moi que je suis en train de traverser.', category: 'C' },
        { letter: 'D', text: 'L\'une d\'elles m\'a laissé(e) avec une blessure que je porte encore.', category: 'D' },
        { letter: 'E', text: 'Elles m\'ont montré ce que je ne veux plus. Je cherche autre chose.', category: 'E' },
      ],
    },
    {
      title: 'Quelle phrase vous ressemble le plus en ce moment ?',
      options: [
        { letter: 'A', text: '« Je suis bien comme je suis. Si quelque chose arrive, tant mieux. »', category: 'A' },
        { letter: 'B', text: '« Je veux un amour vrai, mais je prends mon temps. »', category: 'B' },
        { letter: 'C', text: '« Je ne suis plus tout à fait la même personne qu\'il y a un an. »', category: 'C' },
        { letter: 'D', text: '« J\'ai besoin de douceur. De quelqu\'un qui ne me fasse pas de mal. »', category: 'D' },
        { letter: 'E', text: '« J\'ai envie de tout recommencer sur de nouvelles bases. »', category: 'E' },
      ],
    },
    {
      title: 'Face à une rencontre potentielle, quelle est votre réaction instinctive ?',
      options: [
        { letter: 'A', text: 'Une légère surprise. Je n\'étais pas en train de chercher.', category: 'A' },
        { letter: 'B', text: 'De l\'intérêt, mais aussi de la prudence. J\'observe avant de m\'avancer.', category: 'B' },
        { letter: 'C', text: 'Une intensité immédiate. Je sens si quelque chose peut être fort.', category: 'C' },
        { letter: 'D', text: 'De la méfiance douce. J\'espère, mais je me protège.', category: 'D' },
        { letter: 'E', text: 'De la curiosité. Est-ce que cette personne peut m\'apporter quelque chose de neuf ?', category: 'E' },
      ],
    },
    {
      title: 'Qu\'est-ce que vous attendez de l\'amour, fondamentalement ?',
      options: [
        { letter: 'A', text: 'Rien de précis. La surprise fait partie de ce qui m\'attire.', category: 'A' },
        { letter: 'B', text: 'Une base sûre. Quelqu\'un sur qui je peux compter vraiment.', category: 'B' },
        { letter: 'C', text: 'Une expérience qui me dépasse et me transforme.', category: 'C' },
        { letter: 'D', text: 'Quelqu\'un qui me voit tel(le) que je suis, avec bienveillance.', category: 'D' },
        { letter: 'E', text: 'Un souffle nouveau. Quelqu\'un qui me donne envie de me réinventer.', category: 'E' },
      ],
    },
    {
      title: 'Comment occupez-vous votre vie en dehors de l\'amour en ce moment ?',
      options: [
        { letter: 'A', text: 'Je vis pleinement — projets, amis, plaisirs. L\'amour n\'est pas au centre.', category: 'A' },
        { letter: 'B', text: 'Je construis des choses solides. Je pose des fondations.', category: 'B' },
        { letter: 'C', text: 'Je me cherche, je me transforme. C\'est une période charnière.', category: 'C' },
        { letter: 'D', text: 'Je me recentre sur moi, doucement. Je prends soin de moi.', category: 'D' },
        { letter: 'E', text: 'Je remets des choses en question. Je cherche à me libérer de ce qui me pèse.', category: 'E' },
      ],
    },
    {
      title: 'Si l\'amour frappait à votre porte demain, quelle serait votre première pensée ?',
      options: [
        { letter: 'A', text: '« Je ne m\'y attendais pas — mais pourquoi pas. »', category: 'A' },
        { letter: 'B', text: '« Est-ce que cette personne est vraiment fiable ? »', category: 'B' },
        { letter: 'C', text: '« Est-ce que c\'est quelqu\'un qui peut me correspondre en profondeur ? »', category: 'C' },
        { letter: 'D', text: '« Est-ce que je suis prêt(e) à faire confiance à nouveau ? »', category: 'D' },
        { letter: 'E', text: '« Est-ce que cette personne peut m\'aider à avancer vers ce que je veux devenir ? »', category: 'E' },
      ],
    },
    {
      title: 'Quelle image vous parle le plus pour décrire où vous en êtes ?',
      options: [
        { letter: 'A', text: 'Un champ ouvert, sous un ciel calme. Rien de prévu, tout est possible.', category: 'A' },
        { letter: 'B', text: 'Une maison qu\'on construit brique par brique, avec soin.', category: 'B' },
        { letter: 'C', text: 'Un chrysalide. Quelque chose se prépare, même si on ne voit pas encore quoi.', category: 'C' },
        { letter: 'D', text: 'Un jardin après l\'hiver. La vie reprend, doucement.', category: 'D' },
        { letter: 'E', text: 'Une fenêtre qu\'on ouvre après longtemps. L\'air entre enfin.', category: 'E' },
      ],
    },
  ],

  /* ── Les 5 resultats ── */

  results: {
    A: {
      name: 'L\'Amour Inattendu',
      icon: 'sparkles',
      tagline: 'Ce qui arrive quand on ne cherche plus',
      description:
        'Vous n\'attendez rien — et c\'est précisément ce qui vous rend disponible à quelque chose de vrai. L\'amour inattendu ne se planifie pas, ne se force pas. Il arrive quand la vie coule, quand vous êtes simplement là, dans votre plénitude. C\'est une rencontre qui tombe au moment où vous ne regardiez pas, avec une personne qui ne correspond peut-être à aucun de vos « critères » mais qui résonne profondément. Ce type d\'amour est souvent le plus durable, car il ne naît pas d\'un manque — il naît d\'une rencontre entre deux personnes qui n\'avaient pas besoin l\'une de l\'autre pour être heureuses.',
      howItWorks:
        'L\'amour inattendu fonctionne par synchronicité. Il surgit dans les moments de lâcher-prise, quand vous avez cessé de contrôler, de chercher, de vouloir. C\'est un amour qui vous choisit autant que vous le choisissez. Sa force réside dans sa simplicité : pas de jeux, pas de calculs, juste deux personnes qui se reconnaissent.',
      signs: [
        'Vous êtes bien dans votre vie telle qu\'elle est, avec ou sans relation',
        'L\'idée d\'une rencontre vous plaît mais ne vous obsède pas',
        'Vous avez intégré vos expériences passées sans amertume',
        'Vous vivez dans le présent plutôt que dans l\'attente',
        'Les gens autour de vous remarquent votre sérénité',
      ],
      development: [
        'Continuez à vivre pleinement — c\'est dans cet état que l\'amour inattendu se manifeste',
        'Restez ouverte aux rencontres sans chercher à les provoquer',
        'Faites confiance au timing de la vie plutôt qu\'au vôtre',
      ],
      practices:
        'Cultivez la gratitude pour ce que vous avez déjà. L\'amour inattendu arrive quand le coeur est plein, pas quand il est en manque. Chaque jour, notez trois choses qui vous rendent heureuse dans votre vie actuelle.',
      affirmation:
        'Je suis ouverte à ce que la vie m\'apporte. L\'amour viendra au bon moment, sous la forme qui me correspond.',
    },
    B: {
      name: 'La Douceur Construite',
      icon: 'home',
      tagline: 'Un amour solide, bâti brique par brique',
      description:
        'Vous ne voulez plus de montagnes russes. Ce que votre coeur appelle, c\'est un amour qui se construit dans la durée — pas dans la fulgurance d\'une passion mais dans la constance d\'une présence. La douceur construite est un amour patient. C\'est une personne qui revient chaque jour, qui tient ses promesses, qui ne disparaît pas au premier orage. Vous avez peut-être traversé des relations instables ou des déceptions qui vous ont appris une chose essentielle : la solidité vaut plus que l\'intensité.',
      howItWorks:
        'Ce type d\'amour ne commence pas toujours par un coup de foudre. Il commence souvent par une amitié, une confiance qui s\'installe progressivement, un respect mutuel qui se transforme en quelque chose de plus profond. C\'est un amour qui grandit plutôt qu\'il n\'explose. Et c\'est exactement ce dont vous avez besoin.',
      signs: [
        'Vous cherchez la fiabilité plutôt que l\'excitation dans une relation',
        'La prudence est devenue une force, pas un frein',
        'Vous prenez le temps d\'observer avant de vous engager',
        'Vous préférez construire lentement que brûler vite',
        'La stabilité émotionnelle est votre priorité',
      ],
      development: [
        'Acceptez que le début soit calme — la profondeur viendra avec le temps',
        'Ne confondez pas la prudence avec la fermeture : restez ouverte tout en vous protégeant',
        'Faites confiance à votre instinct quand quelqu\'un vous semble sincère',
      ],
      practices:
        'Quand vous rencontrez quelqu\'un, posez-vous cette question : « Est-ce que je me sens en sécurité avec cette personne ? » La sécurité émotionnelle est le fondement de la douceur construite. Écoutez cette sensation avant tout le reste.',
      affirmation:
        'Je mérite un amour stable et fiable. Je construis l\'avenir que je souhaite, avec patience et confiance.',
    },
    C: {
      name: 'La Transformation Profonde',
      icon: 'flame',
      tagline: 'Un amour qui vous révèle à vous-même',
      description:
        'Vous êtes en pleine mutation. Quelque chose en vous est en train de changer — votre façon de voir l\'amour, vos attentes, peut-être même votre identité. L\'amour qui se prépare pour vous n\'est pas un amour « confortable ». C\'est un amour catalyseur, une rencontre qui accélère votre transformation et vous révèle des parts de vous-même que vous ne connaissiez pas encore. Ce n\'est pas forcément un amour facile — mais c\'est un amour profondément authentique. Une relation qui vous pousse à grandir, à vous dépasser, à devenir celle que vous êtes vraiment en train de devenir.',
      howItWorks:
        'L\'amour transformateur agit comme un miroir. Il reflète ce que vous êtes en train de traverser et amplifie votre processus de changement. La personne qui entre dans votre vie à ce moment-là n\'est pas là par hasard — elle porte quelque chose qui résonne avec ce que vous êtes en train de découvrir en vous.',
      signs: [
        'Vous sentez que vous n\'êtes plus la même personne qu\'avant',
        'Vos anciens schémas amoureux ne vous parlent plus',
        'Vous êtes attirée par l\'intensité et la profondeur',
        'Vous traversez une période de remise en question',
        'L\'idée d\'une relation superficielle vous semble impossible',
      ],
      development: [
        'Accueillez le changement en cours — il prépare le terrain pour un amour à votre mesure',
        'N\'ayez pas peur de l\'intensité : elle est le signe que quelque chose de vrai se passe',
        'Laissez-vous transformer sans chercher à contrôler le processus',
      ],
      practices:
        'Tenez un journal de votre transformation. Notez ce qui change en vous, ce que vous comprenez de nouveau sur l\'amour, ce que vous ne tolérez plus. Cette conscience est la clé pour accueillir l\'amour qui arrive.',
      affirmation:
        'Je suis en pleine transformation, et l\'amour qui m\'attend est à la hauteur de celle que je deviens.',
    },
    D: {
      name: 'La Réparation du Coeur',
      icon: 'heart',
      tagline: 'Un amour qui guérit les blessures',
      description:
        'Votre coeur porte encore les traces d\'une blessure. Pas forcément une rupture récente — parfois c\'est une douleur plus ancienne, plus profonde, qui continue de colorer votre façon d\'aimer et d\'être aimée. L\'amour qui se prépare pour vous est un amour réparateur. Pas un amour qui vous « sauve » — vous n\'avez pas besoin d\'être sauvée. Mais un amour qui, par sa douceur et sa constance, vous redonne confiance en la possibilité d\'être vue, respectée, choisie. Un amour qui prouve, par sa simple existence, que la tendresse est encore possible.',
      howItWorks:
        'L\'amour réparateur ne cherche pas à effacer le passé. Il se place à côté de vos blessures avec bienveillance et vous montre qu\'on peut être fragile et aimée en même temps. C\'est une présence qui ne fuit pas devant votre vulnérabilité mais qui la reçoit comme un cadeau de confiance.',
      signs: [
        'Vous portez encore une blessure émotionnelle, même si vous avancez',
        'La confiance est difficile à accorder, même quand vous le voulez',
        'Vous avez besoin de douceur et de patience de la part de l\'autre',
        'Vous vous protégez instinctivement, parfois trop',
        'L\'idée d\'être vulnérable vous fait à la fois peur et envie',
      ],
      development: [
        'Autorisez-vous à guérir à votre rythme — il n\'y a pas de délai pour cicatriser',
        'Acceptez que la confiance se reconstruise petit à petit, pas d\'un seul coup',
        'N\'attendez pas d\'être « complètement guérie » pour vous ouvrir — l\'amour peut faire partie de la guérison',
      ],
      practices:
        'Chaque soir, posez votre main sur votre coeur et dites-vous : « Je me donne le droit de guérir. Je me donne le droit d\'être aimée. » Ce n\'est pas un exercice — c\'est un rappel. Votre coeur sait cicatriser. Laissez-le faire.',
      affirmation:
        'Ma blessure ne définit pas mon avenir. L\'amour que je mérite saura être doux avec ce que je porte.',
    },
    E: {
      name: 'La Libération',
      icon: 'bird',
      tagline: 'Un amour qui ouvre de nouveaux horizons',
      description:
        'Vous sentez que quelque chose doit changer. Pas seulement dans votre vie amoureuse — dans votre vie tout court. Vous avez besoin d\'air, d\'espace, de nouveauté. L\'amour qui se prépare pour vous est un amour libérateur : une rencontre qui vous sort de ce que vous connaissez, qui casse vos routines, qui vous donne envie de vous réinventer. Ce n\'est pas un amour qui vous enferme dans un schéma de plus. C\'est un amour qui ouvre les fenêtres. Une personne qui vous montre une autre façon de vivre, d\'aimer, d\'être. Quelqu\'un qui vous donne la permission d\'être celle que vous avez envie de devenir.',
      howItWorks:
        'L\'amour libérateur fonctionne comme un catalyseur de changement. Il ne vous change pas — il vous donne l\'élan pour vous changer vous-même. La personne qui entre dans votre vie à ce moment agit comme un miroir de vos désirs profonds, ceux que vous n\'osiez peut-être pas encore formuler.',
      signs: [
        'Vous ressentez un besoin profond de changement dans votre vie',
        'Ce qui vous convenait avant ne vous suffit plus',
        'Vous êtes attirée par la nouveauté, l\'inconnu, l\'aventure',
        'Vous remettez en question des choses que vous acceptiez autrefois',
        'L\'idée de recommencer à zéro vous excite plus qu\'elle ne vous effraie',
      ],
      development: [
        'Honorez ce besoin de changement — il porte une sagesse',
        'N\'ayez pas peur de laisser partir ce qui ne vous correspond plus',
        'L\'amour qui libère commence par se libérer soi-même',
      ],
      practices:
        'Identifiez une chose dans votre vie qui ne vous correspond plus et posez un premier geste vers le changement. L\'amour libérateur arrive souvent quand vous avez déjà commencé à vous libérer vous-même. Le premier pas vous appartient.',
      affirmation:
        'Je me libère de ce qui me retient. L\'amour qui m\'attend est un souffle nouveau, aligné avec celle que je deviens.',
    },
  },
};

const test: TestProfils | TestScore = quizConfig;
export default test;
