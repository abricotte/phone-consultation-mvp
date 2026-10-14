// Test porté du site elena-wolska.com (ressources gratuites, page « quiz-contrat-ame »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const quizConfig: TestProfils = {
  mode: 'profils',
  slug: 'contrat-dame',
  title: 'Quel est Mon Contrat d\'Âme ?',
  subtitle:
    'Découvrez quel accord sacré régit votre relation amoureuse parmi les 12 types de contrats d\'âmes',
  tag: '16 Questions · 8 min',

  intro: [
    'Chaque relation amoureuse est régie par un <strong>contrat d\'âme</strong> spécifique.',
    'Ce contrat, établi avant votre naissance, définit le but, la durée et l\'intensité de cette connexion. Il explique pourquoi certaines relations sont douces et harmonieuses, d\'autres passionnées et tumultueuses, et d\'autres encore brèves mais transformatrices.',
    'Ce test vous aide à identifier quel type de contrat d\'âme vous lie à la personne qui occupe vos pensées. <strong>Répondez avec honnêteté</strong> en pensant à cette relation spécifique.',
  ],
  questions: [
    {
      title: 'Comment avez-vous ressenti votre première rencontre avec cette personne ?',
      options: [
        { letter: 'A', text: 'Un choc électrique, une reconnaissance instantanée et bouleversante', category: 'FJ' },
        { letter: 'B', text: 'Un sentiment de « rentrer à la maison », de confort immédiat', category: 'AS' },
        { letter: 'C', text: 'Une attraction magnétique inexplicable, presque obsessionnelle', category: 'K' },
        { letter: 'D', text: 'Une explosion de passion intense et inattendue', category: 'CA' },
      ],
    },
    {
      title: 'Quel est le pattern dominant de votre relation ?',
      options: [
        { letter: 'A', text: 'Des cycles de séparation et de réunion répétés (on-off)', category: 'FJ' },
        { letter: 'B', text: 'Des conflits répétitifs, difficile de partir malgré la souffrance', category: 'K' },
        { letter: 'C', text: 'Relation fluide et harmonieuse, peu de drames majeurs', category: 'AS' },
        { letter: 'D', text: 'Des défis constants qui me poussent hors de ma zone de confort', category: 'A' },
      ],
    },
    {
      title: 'Quelle leçon principale cette relation vous enseigne-t-elle ?',
      options: [
        { letter: 'A', text: 'L\'amour de soi, les limites saines, la valeur personnelle', category: 'A' },
        { letter: 'B', text: 'À voir mes parts d\'ombre, à comprendre mes projections', category: 'M' },
        { letter: 'C', text: 'La guérison de blessures d\'enfance ou de vies passées', category: 'G' },
        { letter: 'D', text: 'Le pardon, l\'équilibre, la résolution d\'une dette karmique', category: 'K' },
      ],
    },
    {
      title: 'Comment cette personne vous fait-elle sentir la plupart du temps ?',
      options: [
        { letter: 'A', text: 'En paix, soutenu(e), compris(e) profondément', category: 'AS' },
        { letter: 'B', text: 'Intense, vivant(e), transformé(e), parfois déchiré(e)', category: 'FJ' },
        { letter: 'C', text: 'Désespéré(e), blessé(e), mais incapable de lâcher prise', category: 'CB' },
        { letter: 'D', text: 'Stable, en sécurité, mais sans grande passion', category: 'CO' },
      ],
    },
    {
      title: 'Quel effet cette relation a-t-elle eu sur votre vie ?',
      options: [
        { letter: 'A', text: 'Elle a tout bouleversé – j\'ai pris des décisions radicales', category: 'CA' },
        { letter: 'B', text: 'Elle m\'a éveillé(e) spirituellement, changé ma vision du monde', category: 'RE' },
        { letter: 'C', text: 'Elle m\'a aidé(e) à guérir des blessures profondes', category: 'G' },
        { letter: 'D', text: 'Elle m\'accompagne dans mon évolution de façon harmonieuse', category: 'AS' },
      ],
    },
    {
      title: 'Comment décririez-vous l\'intensité de cette connexion ?',
      options: [
        { letter: 'A', text: 'Extrême – c\'est la connexion la plus intense de ma vie', category: 'FJ' },
        { letter: 'B', text: 'Très élevée et souvent douloureuse, mais je ne peux pas partir', category: 'K' },
        { letter: 'C', text: 'Profonde mais douce, comme un océan calme', category: 'AS' },
        { letter: 'D', text: 'Modérée et stable, confortable sans être passionnée', category: 'CO' },
      ],
    },
    {
      title: 'Ressentez-vous une connexion télépathique avec cette personne ?',
      options: [
        { letter: 'A', text: 'Oui, constamment – je sens ses émotions, on pense aux mêmes choses', category: 'FJ' },
        { letter: 'B', text: 'Oui, on se comprend souvent sans parler', category: 'AS' },
        { letter: 'C', text: 'Oui, mais c\'est perturbant – je ne peux pas m\'en détacher', category: 'K' },
        { letter: 'D', text: 'Non vraiment, on communique normalement', category: 'CO' },
      ],
    },
    {
      title: 'Cette personne vous renvoie-t-elle vos défauts en miroir ?',
      options: [
        { letter: 'A', text: 'Oui, constamment – elle incarne ce que je refuse de voir en moi', category: 'M' },
        { letter: 'B', text: 'Oui, de façon intense – elle révèle toutes mes ombres', category: 'FJ' },
        { letter: 'C', text: 'Parfois, elle me confronte à mes faiblesses', category: 'A' },
        { letter: 'D', text: 'Non, elle m\'accepte et me soutient tel(le) que je suis', category: 'AS' },
      ],
    },
    {
      title: 'Avez-vous l\'impression d\'avoir une « dette » envers cette personne ?',
      options: [
        { letter: 'A', text: 'Oui, fortement – je sens que je dois quelque chose, réparer quelque chose', category: 'K' },
        { letter: 'B', text: 'Oui, comme si je devais souffrir ou expier quelque chose', category: 'CB' },
        { letter: 'C', text: 'Non, plutôt comme si elle me devait du réconfort et de la guérison', category: 'G' },
        { letter: 'D', text: 'Non, la relation est équilibrée et réciproque', category: 'AS' },
      ],
    },
    {
      title: 'Comment voyez-vous l\'avenir de cette relation ?',
      options: [
        { letter: 'A', text: 'Ensemble pour la vie, construisant un avenir solide', category: 'AS' },
        { letter: 'B', text: 'Incertain mais éternel – on sera toujours liés, d\'une façon ou d\'une autre', category: 'FJ' },
        { letter: 'C', text: '⏳ Intense mais temporaire – elle servait à me réveiller', category: 'CA' },
        { letter: 'D', text: 'Pour une étape spécifique de ma vie, puis on évoluera séparément', category: 'CO' },
      ],
    },
    {
      title: 'Cette relation vous a-t-elle fait souffrir intensément ?',
      options: [
        { letter: 'A', text: 'Oui, énormément – c\'est la plus grande douleur de ma vie', category: 'CB' },
        { letter: 'B', text: 'Oui, c\'est difficile et conflictuel, mais je ne peux pas partir', category: 'K' },
        { letter: 'C', text: 'Oui, mais cette souffrance me transforme profondément', category: 'FJ' },
        { letter: 'D', text: 'Non, elle m\'apaise et guérit mes anciennes douleurs', category: 'G' },
      ],
    },
    {
      title: 'Avez-vous répété le même schéma relationnel avant cette personne ?',
      options: [
        { letter: 'A', text: 'Oui, c\'est le même pattern toxique amplifié à l\'extrême', category: 'R' },
        { letter: 'B', text: 'Oui, je sens que je rejoue quelque chose d\'ancien', category: 'K' },
        { letter: 'C', text: 'Non, c\'est différent – j\'ai déjà fait le travail sur moi', category: 'COU' },
        { letter: 'D', text: 'Partiellement, mais cette fois je vois les choses clairement', category: 'A' },
      ],
    },
    {
      title: 'Comment la relation a-t-elle débuté par rapport à votre situation de vie ?',
      options: [
        { letter: 'A', text: 'J\'étais coincé(e) dans ma vie, elle a tout bouleversé', category: 'CA' },
        { letter: 'B', text: 'J\'étais fermé(e) spirituellement, elle m\'a ouvert les yeux', category: 'RE' },
        { letter: 'C', text: 'À un tournant crucial où j\'avais besoin d\'apprendre quelque chose', category: 'A' },
        { letter: 'D', text: 'À un moment d\'ouverture et de disponibilité pour l\'amour', category: 'AS' },
      ],
    },
    {
      title: 'Quel est le timing de cette relation ?',
      options: [
        { letter: 'A', text: 'Intense mais brève – quelques mois explosifs', category: 'CA' },
        { letter: 'B', text: 'Plusieurs années stables pour une étape de vie précise', category: 'CO' },
        { letter: 'C', text: 'Long terme, ça se renforce avec le temps', category: 'AS' },
        { letter: 'D', text: 'On-off depuis des années, impossible de se quitter vraiment', category: 'FJ' },
      ],
    },
    {
      title: 'Cette personne vous offre-t-elle ce dont vous aviez toujours manqué ?',
      options: [
        { letter: 'A', text: 'Oui, exactement – elle comble une blessure d\'enfance', category: 'G' },
        { letter: 'B', text: 'Oui, elle est l\'amour mature que je mérite après tout mon travail', category: 'COU' },
        { letter: 'C', text: 'Non, elle répète les manques et les souffrances', category: 'K' },
        { letter: 'D', text: 'Non, elle me confronte plutôt à ce que je dois développer moi-même', category: 'M' },
      ],
    },
    {
      title: 'Si cette relation devait se terminer demain, que ressentiriez-vous ?',
      options: [
        { letter: 'A', text: 'Dévasté(e) mais je saurais que notre lien est éternel', category: 'FJ' },
        { letter: 'B', text: 'Profondément triste, j\'aurais perdu mon compagnon d\'âme', category: 'AS' },
        { letter: 'C', text: 'Triste mais reconnaissant(e) pour la leçon apprise', category: 'A' },
        { letter: 'D', text: 'Douloureux mais libérateur – il était temps', category: 'CB' },
        { letter: 'E', text: 'En paix – on a accompli ce qu\'on devait ensemble', category: 'CO' },
      ],
    },
  ],
  results: {
    K: {
      name: 'Le Contrat Karmique',
      icon: 'scale',
      tagline: 'Équilibrer une dette du passé',
      description:
        'Votre relation est un contrat karmique. Vous êtes réunis pour rééquilibrer une dette spirituelle d\'une vie passée. Cette connexion est intense, souvent difficile, mais elle vous offre l\'opportunité de guérir une blessure ancienne et de restaurer l\'équilibre énergétique entre vos deux âmes.',
      howItWorks:
        'Le contrat karmique se manifeste par une attraction paradoxale : vous êtes irréversiblement attiré(e) par cette personne, même lorsque la relation vous fait souffrir. Les mêmes disputes reviennent en boucle, les ruptures sont dramatiques et souvent temporaires, et vous avez parfois un sentiment troublant de déjà-vu émotionnel.',
      signs: [
        'Attraction magnétique malgré une relation souvent difficile',
        'Sensation de « dette » ou d\'obligation envers cette personne',
        'Patterns destructeurs qui se répètent en boucle',
        'Difficulté de partir même quand la relation est toxique',
        'Sentiment d\'avoir déjà vécu cette dynamique auparavant',
      ],
      development: [
        'Concentrez-vous sur le pardon – envers cette personne et envers vous-même',
        'Le but n\'est pas de rester à tout prix, mais d\'équilibrer le karma et d\'apprendre la leçon',
        'Identifiez les patterns qui se répètent et choisissez consciemment une réponse différente',
        'Durée : jusqu\'à résolution du karma · Intensité : très élevée',
      ],
      practices:
        'La méditation du pardon, le travail sur les vies antérieures et la thérapie des mémoires karmiques sont particulièrement recommandés. Tenez un journal pour identifier les cycles répétitifs et vos réactions automatiques.',
      affirmation:
        'Je libère avec amour les dettes du passé et j\'accueille l\'équilibre dans cette relation.',
    },
    A: {
      name: 'Le Contrat d\'Apprentissage',
      icon: 'graduation-cap',
      tagline: 'Apprendre une leçon spécifique',
      description:
        'Votre relation est un contrat d\'apprentissage. Cette personne est entrée dans votre vie pour vous enseigner une leçon précise : l\'amour de soi, les limites, la patience, la vulnérabilité. Elle arrive au moment parfait où vous avez besoin d\'apprendre quelque chose d\'essentiel pour votre évolution.',
      howItWorks:
        'Ce contrat se manifeste par une confrontation rapide avec vos patterns. La relation vous pousse hors de votre zone de confort – pas de manière brutale, mais insistante. Vous vous surprenez à dire : « Je refais exactement ce que j\'ai toujours fait. » C\'est le signe que la leçon se présente.',
      signs: [
        'Arrive à un tournant crucial de votre vie',
        'Vous pousse constamment hors de votre zone de confort',
        'Vous confronte à vos peurs et vos faiblesses',
        'Transformation personnelle majeure grâce à cette relation',
        'La relation se termine naturellement après l\'apprentissage',
      ],
      development: [
        'Identifiez clairement la leçon à apprendre dans cette relation',
        'Plus vite vous l\'intégrez, plus vite le contrat peut évoluer ou se compléter',
        'Soyez reconnaissant(e) pour cet enseignement, même s\'il est inconfortable',
        'Durée : le temps d\'intégrer la leçon · Intensité : moyenne à élevée',
      ],
      practices:
        'Le journaling introspectif, la thérapie et les exercices de développement personnel sont vos meilleurs alliés. Posez-vous chaque semaine la question : « Qu\'est-ce que cette relation m\'apprend sur moi-même ? »',
      affirmation:
        'J\'accueille les leçons de cette relation avec gratitude et j\'évolue à chaque instant.',
    },
    AS: {
      name: 'Le Contrat d\'Âme Sœur',
      icon: 'heart',
      tagline: 'Compagnon de vie harmonieux',
      description:
        'Vous avez trouvé votre âme sœur. Cette personne fait partie de votre groupe d\'âmes et vous vous êtes incarnés ensemble plusieurs fois. Votre connexion est profonde, harmonieuse et mutuellement soutenante. Ensemble, vous évoluez spirituellement dans la douceur et l\'amour inconditionnel.',
      howItWorks:
        'La facilité naturelle est la signature de ce contrat. Vous n\'avez pas besoin de vous forcer ni de jouer un rôle. Il y a une communication intuitive – un regard suffit souvent. Vous finissez les phrases de l\'autre et vous savez ce que l\'autre ressent même à distance.',
      signs: [
        'Connexion instantanée et sentiment de « rentrer à la maison »',
        'Communication facile et naturelle, même sans mots',
        'Vous vous comprenez profondément sans jugement',
        'Relation équilibrée où chacun se sent soutenu',
        'Évolution spirituelle ensemble, en harmonie',
      ],
      development: [
        'Chérissez cette connexion rare et précieuse',
        'Continuez à grandir ensemble tout en respectant l\'individualité de chacun',
        'Votre amour est un sanctuaire – cultivez-le avec intention',
        'Durée : souvent toute la vie · Intensité : douce et stable',
      ],
      practices:
        'Les rituels de couple, la méditation à deux et les projets communs nourrissent votre lien. Créez des moments sacrés ensemble et maintenez votre connexion spirituelle active.',
      affirmation:
        'Je reconnais et j\'honore cette connexion d\'âme sœur qui illumine ma vie.',
    },
    FJ: {
      name: 'Le Contrat de Flamme Jumelle',
      icon: 'flame',
      tagline: 'Votre miroir spirituel ultime',
      description:
        'Vous êtes en relation avec votre flamme jumelle – l\'autre moitié de votre essence spirituelle. Cette connexion est la plus intense, transformatrice et souvent douloureuse. Elle vous force à faire face à toutes vos ombres pour atteindre l\'ascension spirituelle.',
      howItWorks:
        'L\'intensité est immédiate et totale – physique, émotionnelle, spirituelle. Le parcours est rarement linéaire : il y a des phases de fusion intense suivies de phases de séparation, que les traditions appellent « la course et la poursuite ». Ces phases ne sont pas des dysfonctionnements – elles font partie du design du contrat.',
      signs: [
        'Reconnaissance instantanée et bouleversante au premier regard',
        'Effet miroir puissant : vous voyez toutes vos ombres en elle/lui',
        'Cycles de séparation-réunion (runner/chaser) répétés',
        'Connexion télépathique et synchronicités constantes',
        'Transformation spirituelle profonde et bouleversements de vie',
        'Amour inconditionnel malgré la distance ou les obstacles',
      ],
      development: [
        'Concentrez-vous sur votre propre travail intérieur plutôt que sur l\'union',
        'La flamme jumelle est d\'abord un chemin de transformation personnelle',
        'Lâchez l\'obsession du résultat et faites confiance au processus',
        'Durée : connexion éternelle · Intensité : extrême',
      ],
      practices:
        'La méditation, le travail sur l\'ombre (shadow work), l\'écriture intuitive et les pratiques d\'ancrage sont essentiels. Focalisez sur votre propre guérison plutôt que sur la réunion avec votre flamme.',
      affirmation:
        'Je me transforme à travers cette connexion sacrée et je fais confiance au chemin de nos âmes.',
    },
    M: {
      name: 'Le Contrat Miroir',
      icon: 'flip-horizontal-2',
      tagline: 'Refléter vos parts d\'ombre',
      description:
        'Cette personne agit comme un miroir de vos parts non guéries. Tout ce qui vous agace chez elle reflète quelque chose que vous devez guérir en vous. Ce contrat est confrontant mais essentiel pour votre prise de conscience et votre évolution personnelle.',
      howItWorks:
        'Cette personne déclenche en vous des réactions disproportionnées – positives ou négatives. Ce qui vous agace le plus chez elle est souvent ce que vous n\'acceptez pas en vous-même. Les conflits ont une qualité de révélation : après chaque dispute, vous comprenez quelque chose de nouveau sur vous-même.',
      signs: [
        'Cette personne vous énerve profondément dans certains comportements',
        'Elle incarne des traits que vous refusez de voir en vous',
        'Réactions émotionnelles disproportionnées face à ses actions',
        'Prise de conscience soudaine sur vous-même grâce à elle',
        'Relation qui vous met face à vos contradictions',
      ],
      development: [
        'Demandez-vous : « Qu\'est-ce que cette personne me montre sur moi-même ? »',
        'Travaillez sur les aspects de votre personnalité qu\'elle révèle',
        'Une fois la leçon intégrée, l\'irritation disparaîtra naturellement',
        'Durée : jusqu\'à l\'intégration des ombres · Intensité : confrontante',
      ],
      practices:
        'Le travail sur l\'ombre (shadow work), la thérapie par le miroir et les exercices de projection sont recommandés. Chaque conflit est une opportunité de comprendre une part cachée de vous-même.',
      affirmation:
        'J\'accueille le reflet de mon miroir avec courage et je grandis à travers cette vérité.',
    },
    CA: {
      name: 'Le Contrat Catalyseur',
      icon: 'alarm-clock',
      tagline: 'Déclencher un changement radical',
      description:
        'Cette personne est entrée dans votre vie pour déclencher un changement majeur. Elle bouleverse tout – votre vie, vos croyances, votre direction. Souvent brève mais explosive, cette relation marque un avant/après dans votre existence et vous réveille à votre vraie vie.',
      howItWorks:
        'L\'intensité est immédiate et explosive. En quelques semaines ou quelques mois, cette personne bouleverse vos certitudes, vos habitudes, votre vision du monde. Vous avez la sensation que votre vie d\'avant appartenait à quelqu\'un d\'autre. Après cette rencontre, impossible de revenir en arrière.',
      signs: [
        'Rencontre survient quand vous êtes « coincé(e) » dans votre vie',
        'Relation intense et passionnée mais de courte durée',
        'Vous prenez des décisions majeures pendant ou après cette relation',
        'Rupture avec votre ancienne vie (déménagement, changement de carrière, etc.)',
        'La personne disparaît une fois le changement initié',
      ],
      development: [
        'Ne résistez pas au changement qu\'elle apporte dans votre vie',
        'Cette personne n\'est pas censée rester, mais être le déclencheur de votre transformation',
        'Embrassez le chaos créatif et faites confiance au processus',
        'Durée : courte mais intense · Intensité : explosive',
      ],
      practices:
        'L\'écriture de transition, les rituels de lâcher-prise et l\'accompagnement thérapeutique sont précieux pendant cette période de transformation. Accueillez le changement comme un cadeau.',
      affirmation:
        'J\'embrasse le changement que cette rencontre déclenche et je m\'ouvre à ma vraie vie.',
    },
    G: {
      name: 'Le Contrat de Guérison',
      icon: 'sprout',
      tagline: 'Guérir une blessure profonde',
      description:
        'Cette personne est arrivée dans votre vie pour vous aider à guérir une blessure d\'enfance ou d\'une vie passée. Elle vous offre l\'amour, la sécurité ou la validation dont vous aviez besoin mais que vous n\'aviez jamais reçu. Sa présence est réparatrice et apaisante.',
      howItWorks:
        'La signature de ce contrat est une sensation de sécurité que vous n\'avez peut-être jamais connue. Avec cette personne, vous pouvez déposer les armes. Vous n\'avez pas besoin de performer ni de prouver votre valeur. L\'amour est là, offert, constant.',
      signs: [
        'Sentiment d\'être enfin « vu(e) » et compris(e) profondément',
        'Cette personne vous offre ce dont vous avez toujours manqué',
        'Guérison émotionnelle progressive en sa présence',
        'Relation douce et réparatrice, peu de conflits',
        'Vous vous sentez apaisé(e) et entier(e) avec elle',
      ],
      development: [
        'Accueillez cette guérison avec gratitude et ouverture',
        'Permettez-vous de recevoir l\'amour et le soin offerts',
        'Cette relation vous montre que vous êtes digne d\'amour',
        'Durée : variable, souvent durable · Intensité : douce et réparatrice',
      ],
      practices:
        'Les pratiques d\'auto-compassion, la méditation de guérison et le travail sur l\'enfant intérieur complètent ce que cette relation vous apporte. Apprenez à recevoir autant qu\'à donner.',
      affirmation:
        'Je mérite l\'amour et la guérison que cette relation m\'offre. Je m\'ouvre à la douceur.',
    },
    CO: {
      name: 'Le Contrat du Compagnon',
      icon: 'drama',
      tagline: 'Partager une étape de vie',
      description:
        'Ce contrat vise à parcourir ensemble une étape spécifique de la vie. Vous vous soutenez mutuellement pendant une période définie (études, premiers emplois, élever des enfants), puis chacun continue son chemin. La relation est stable et fonctionnelle.',
      howItWorks:
        'La rencontre arrive souvent à un moment de transition. Il y a une compatibilité naturelle dans les valeurs et le rythme de vie. Le lien est stable, confortable, et loin d\'être ennuyeux. Vous construisez ensemble quelque chose de concret : un foyer, un projet, une vie qui a du sens.',
      signs: [
        'Rencontre à un moment de transition ou nouveau départ',
        'Relation stable et fonctionnelle sans grande passion',
        'Vous accomplissez des objectifs concrets ensemble',
        'Fin naturelle et pacifique quand l\'étape est terminée',
        'Respect et gratitude mutuels après la séparation',
      ],
      development: [
        'Acceptez que certaines relations sont belles même si elles ne durent pas toute une vie',
        'Honorez ce que vous construisez ensemble au quotidien',
        'Ne forcez pas la relation à continuer au-delà de son contrat',
        'Durée : durée de l\'étape de vie · Intensité : modérée et stable',
      ],
      practices:
        'Les projets communs, la communication intentionnelle et les moments de qualité renforcent ce lien. Cultivez la gratitude pour ce compagnonnage précieux.',
      affirmation:
        'J\'honore ce compagnonnage et je suis reconnaissant(e) pour chaque pas parcouru ensemble.',
    },
    CB: {
      name: 'Le Contrat du Cœur Brisé',
      icon: 'heart-crack',
      tagline: 'Apprendre le lâcher-prise',
      description:
        'Cette personne est entrée dans votre vie pour vous briser le cœur et vous apprendre le lâcher-prise. Aussi douloureux soit-il, ce contrat est essentiel pour détruire vos illusions, développer votre amour-propre et vous préparer à un amour authentique.',
      howItWorks:
        'L\'intensité est réelle et profonde. Mais il y a une tension fondamentale entre ce que vous désirez et ce qui est possible. Vous aimez profondément, et pourtant quelque chose empêche l\'union harmonieuse. C\'est douloureux précisément parce que l\'amour est vrai.',
      signs: [
        'Amour intense et passionné au début',
        'Promesses non tenues, espoirs déçus de manière répétée',
        'Fin brutale ou trahison qui vous anéantit',
        'Période de deuil et reconstruction profonde après',
        'Transformation radicale de vos standards relationnels',
      ],
      development: [
        'Permettez-vous de pleurer et de faire le deuil pleinement',
        'Cette douleur vous enseigne votre valeur – vous n\'accepterez plus les miettes',
        'Une fois guéri(e), vous serez prêt(e) pour un amour authentique',
        'Durée : court à moyen terme · Intensité : très douloureuse',
      ],
      practices:
        'Le travail de deuil, la thérapie, les rituels de libération émotionnelle et le renforcement de l\'amour de soi sont essentiels. Le cœur se brise pour se reconstruire plus grand.',
      affirmation:
        'À travers cette brisure, je me reconstruis plus fort(e) et plus digne d\'un amour véritable.',
    },
    R: {
      name: 'Le Contrat de Répétition',
      icon: 'rotate-ccw',
      tagline: 'Briser un pattern destructeur',
      description:
        'Cette personne incarne un pattern que vous répétez depuis plusieurs vies. Elle arrive pour vous forcer à enfin voir et briser ce cycle toxique. L\'intensité est amplifiée à l\'extrême pour que vous ne puissiez plus ignorer la leçon. C\'est votre dernière chance.',
      howItWorks:
        'La sensation de déjà-vu est frappante. Vous vous surprenez à penser : « C\'est exactement comme avec mon ex. » Les patterns se répètent avec une précision presque comique : les mêmes disputes, les mêmes dynamiques, parfois même les mêmes phrases.',
      signs: [
        'Sentiment de « déjà-vu » – vous avez vécu ça avant',
        'Même type de partenaire toxique que dans le passé',
        'Intensité du pattern amplifié à l\'extrême',
        'Prise de conscience soudaine : « Ça suffit, je mérite mieux »',
        'Rupture définitive du cycle après cette relation',
      ],
      development: [
        'C\'est le moment de briser le cycle définitivement',
        'Faites le travail thérapeutique pour comprendre pourquoi vous répétez ce pattern',
        'Changez votre réponse – c\'est la clé pour briser le cycle',
        'Durée : jusqu\'à la prise de conscience · Intensité : extrême',
      ],
      practices:
        'La thérapie des schémas, le travail transgénérationnel et l\'analyse de vos patterns relationnels sont indispensables. Une fois le pattern identifié et brisé, il ne revient plus jamais.',
      affirmation:
        'Je brise ce cycle avec conscience et courage. Ce pattern n\'a plus de pouvoir sur moi.',
    },
    RE: {
      name: 'Le Contrat de Réveilleur',
      icon: 'zap',
      tagline: 'Éveiller votre conscience spirituelle',
      description:
        'Cette personne est arrivée dans votre vie pour déclencher votre éveil spirituel. Elle vous ouvre les yeux sur des dimensions que vous ignoriez – spiritualité, énergie, synchronicités, intuition. Votre vision du monde change complètement après l\'avoir rencontrée.',
      howItWorks:
        'Depuis cette rencontre, votre sensibilité s\'est amplifiée. Les synchronicités se multiplient. Des questions que vous n\'aviez jamais posées surgissent sur le sens de la vie, la spiritualité, ce que vous voulez vraiment. Tout cela a commencé avec cette personne.',
      signs: [
        'Elle parle de concepts spirituels que vous découvrez',
        'Votre vision du monde change complètement après l\'avoir rencontrée',
        'Synchronicités et signes augmentent drastiquement',
        'Vous commencez à explorer la spiritualité, la méditation, etc.',
        'Mission accomplie, elle peut partir une fois que vous êtes « éveillé(e) »',
      ],
      development: [
        'Embrassez cet éveil spirituel avec ouverture et curiosité',
        'Continuez à explorer même si cette personne part de votre vie',
        'L\'éveil est le vrai cadeau, pas nécessairement la relation',
        'Durée : court à moyen terme · Intensité : transformatrice',
      ],
      practices:
        'La méditation, la lecture spirituelle, les pratiques énergétiques et le développement de votre intuition sont votre chemin. Cette personne a ouvert la porte – c\'est à vous de la franchir.',
      affirmation:
        'Mon éveil spirituel est irréversible et précieux. Je suis reconnaissant(e) pour cette ouverture.',
    },
    COU: {
      name: 'Le Contrat de Couronnement',
      icon: 'crown',
      tagline: 'L\'amour que vous méritez',
      description:
        'Ce contrat arrive après que vous ayez fait tout le travail sur vous-même. Cette personne est votre récompense – une relation mature, équilibrée et épanouissante qui honore qui vous êtes devenu(e). C\'est l\'amour sain que vous méritez enfin.',
      howItWorks:
        'Il y a une absence remarquable de drama. L\'amour coule sans effort, sans jeux, sans stratégie. Les deux partenaires arrivent avec une maturité émotionnelle qui rend tout plus simple. Vous n\'avez pas besoin de l\'autre pour être complet(e) – vous êtes deux personnes entières qui partagent leur plénitude.',
      signs: [
        'Arrive après une période intense de travail personnel',
        'Relation saine, mature, sans jeux de pouvoir',
        'Vous vous sentez respecté(e), valorisé(e), aimé(e) inconditionnellement',
        'Pas de drama, juste de l\'amour authentique et stable',
        'Vous savez au fond de vous que c\'est « la bonne personne »',
        'Capacité à construire ensemble un avenir solide',
      ],
      development: [
        'Recevez cet amour avec gratitude et ouverture',
        'Vous l\'avez mérité par tout le travail accompli sur vous-même',
        'Construisez ensemble dans la maturité et la conscience',
        'Durée : durable, souvent vie entière · Intensité : profonde et sereine',
      ],
      practices:
        'La gratitude quotidienne, les rituels de couple conscients et la célébration de votre parcours nourrissent cet amour. Savourez chaque instant – c\'est votre récompense cosmique.',
      affirmation:
        'Je mérite cet amour lumineux. Je l\'accueille avec joie et je le célèbre chaque jour.',
    },
  },
  fallbackCategory: 'NONE',
  spiritualMessage:
    'Chaque contrat d\'âme, même le plus douloureux, est un cadeau sacré. Cette personne a accepté de jouer un rôle dans votre évolution spirituelle. Honorez ce contrat en apprenant ce qu\'il a à vous enseigner.',
  spiritualMessageFallback:
    'Votre relation est unique et ne se réduit pas à un seul type de contrat. Plusieurs dynamiques sont à l\'œuvre, ce qui rend votre lien riche et complexe.',

  labels: {
    secondaryTitle: 'Votre contrat secondaire',
    secondaryDescription:
      'Ce contrat est également présent dans votre relation et peut interagir avec votre contrat principal, créant une dynamique plus complexe et nuancée.',
    profileTitle: 'Votre profil de contrats d\'âmes',
    ctaDescription:
      'Envie de comprendre en profondeur votre contrat d\'âme lors d\'une consultation personnalisée avec Elena ?',
  },
};

const test: TestProfils | TestScore = quizConfig;
export default test;
