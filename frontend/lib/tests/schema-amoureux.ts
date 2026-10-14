// Test porté du site elena-wolska.com (ressources gratuites, page « schema-amoureux »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const quizConfig: TestProfils = {
  mode: 'profils',
  slug: 'schema-amoureux',
  title: 'Votre Schéma Répétitif en Amour',
  subtitle:
    'Identifiez le pattern inconscient qui oriente vos choix amoureux depuis toujours',
  tag: '14 Questions · 7 min',

  intro: [
    'Certaines situations se répètent dans votre vie amoureuse avec une régularité déconcertante. <strong>Ce n\'est pas une coïncidence</strong> — c\'est un schéma, une empreinte intérieure qui oriente vos choix sans que vous en ayez conscience.',
    'Ce test identifie le vôtre parmi cinq grands schémas amoureux. Il ne s\'agit pas de poser une étiquette, mais de <strong>mettre des mots sur ce qui se répète</strong> — pour enfin pouvoir avancer différemment.',
    'Répondez avec honnêteté, en pensant à l\'ensemble de vos relations amoureuses passées et présentes. <strong>Il n\'y a pas de mauvaise réponse.</strong>',
  ],

  fallbackCategory: 'A',

  spiritualMessage:
    'Ce schéma a ses racines — et ses portes de sortie. Ce que vous répétez n\'est pas une fatalité. C\'est un signal. Vous avez maintenant la conscience nécessaire pour choisir autrement.',
  spiritualMessageFallback:
    'Votre profil ne fait pas ressortir un schéma unique — ce qui signifie que plusieurs dynamiques coexistent en vous. C\'est souvent le signe d\'une grande sensibilité relationnelle. Ce que vous portez est plus nuancé qu\'une seule étiquette — et c\'est une force.',

  labels: {
    secondaryTitle: 'Votre schéma secondaire',
    secondaryDescription:
      'Ce schéma est également présent dans votre façon d\'aimer. Il peut se combiner avec votre schéma principal et expliquer certaines contradictions que vous ressentez en couple.',
    profileTitle: 'Votre profil amoureux complet',
    ctaDescription:
      'Ce schéma a ses racines — et ses portes de sortie. Une consultation peut éclairer ce qui se rejoue dans votre situation actuelle.',
  },

  /* ── Les 14 questions ── */

  questions: [
    {
      title: 'Quand vous pensez à vos relations passées, qu\'est-ce qui ressort le plus souvent ?',
      options: [
        { letter: 'A', text: 'Je tombais amoureux(se) de personnes déjà prises, lointaines ou peu disponibles.', category: 'A' },
        { letter: 'B', text: 'Je vivais pour l\'autre, au point de perdre parfois le fil de ma propre vie.', category: 'B' },
        { letter: 'C', text: 'Tout allait bien jusqu\'à ce que ça devienne sérieux, puis je sentais le besoin de fuir.', category: 'C' },
        { letter: 'D', text: 'Je donnais énormément, souvent à des personnes qui traversaient des difficultés.', category: 'D' },
        { letter: 'E', text: 'J\'avais l\'impression de porter la relation seul(e), sans que l\'autre s\'investisse autant.', category: 'E' },
      ],
    },
    {
      title: 'Comment vous sentez-vous au début d\'une nouvelle relation prometteuse ?',
      options: [
        { letter: 'A', text: 'Une intensité presque douloureuse — comme si l\'enjeu était trop grand.', category: 'A' },
        { letter: 'B', text: 'Un bonheur immense, un besoin fort d\'être avec l\'autre le plus possible.', category: 'B' },
        { letter: 'C', text: 'De l\'excitation, mais aussi une petite voix qui dit que ça ne durera pas.', category: 'C' },
        { letter: 'D', text: 'De la tendresse, et l\'envie de comprendre ce que je peux apporter à cette personne.', category: 'D' },
        { letter: 'E', text: 'De l\'espoir prudent — j\'attends de voir si cette fois sera vraiment différente.', category: 'E' },
      ],
    },
    {
      title: 'Qu\'est-ce qui vous attire le plus chez quelqu\'un ?',
      options: [
        { letter: 'A', text: 'Quelque chose d\'insaisissable — une part de mystère ou d\'inaccessibilité.', category: 'A' },
        { letter: 'B', text: 'Une présence totale, une intensité partagée, un lien qui semble unique au monde.', category: 'B' },
        { letter: 'C', text: 'L\'indépendance, la liberté — quelqu\'un qui ne cherche pas à me posséder.', category: 'C' },
        { letter: 'D', text: 'Une fragilité assumée, quelqu\'un qui a traversé des épreuves et se reconstruit.', category: 'D' },
        { letter: 'E', text: 'Quelqu\'un qui semble sincèrement intéressé par moi, pour de vrai.', category: 'E' },
      ],
    },
    {
      title: 'Quand une relation se termine, quelle est votre pensée dominante ?',
      options: [
        { letter: 'A', text: 'Que cette personne n\'était pas vraiment disponible pour une vraie histoire, mais je le savais.', category: 'A' },
        { letter: 'B', text: 'Que je ne retrouverai jamais cette intensité, ce lien unique.', category: 'B' },
        { letter: 'C', text: 'Un mélange de soulagement et de culpabilité.', category: 'C' },
        { letter: 'D', text: 'Que j\'aurais pu faire plus, m\'impliquer davantage.', category: 'D' },
        { letter: 'E', text: 'Que j\'aurais dû voir plus tôt que l\'autre ne me voyait pas vraiment.', category: 'E' },
      ],
    },
    {
      title: 'Comment vous comportez-vous quand la relation devient stable et rassurante ?',
      options: [
        { letter: 'A', text: 'Je me demande si l\'absence de tension veut dire que la passion est partie.', category: 'A' },
        { letter: 'B', text: 'Je m\'y plonge avec bonheur, parfois trop fort.', category: 'B' },
        { letter: 'C', text: 'Une légère inquiétude s\'installe — je sens que quelque chose va changer.', category: 'C' },
        { letter: 'D', text: 'Je m\'assure que l\'autre va bien avant de penser à moi.', category: 'D' },
        { letter: 'E', text: 'Je me demande si c\'est réel, si ça va durer.', category: 'E' },
      ],
    },
    {
      title: 'Quelle phrase résonne le plus avec votre vécu ?',
      options: [
        { letter: 'A', text: '« Ce qui est difficile à obtenir m\'attire davantage que ce qui est simple. »', category: 'A' },
        { letter: 'B', text: '« Quand j\'aime, j\'aime sans réserve. C\'est ma force et parfois ma perte. »', category: 'B' },
        { letter: 'C', text: '« L\'amour, oui — mais sans perdre ma liberté ni mon espace à moi. »', category: 'C' },
        { letter: 'D', text: '« Aimer, c\'est être là pour l\'autre, surtout quand ça va mal. »', category: 'D' },
        { letter: 'E', text: '« Je donne beaucoup. J\'attends d\'être vu en retour. »', category: 'E' },
      ],
    },
    {
      title: 'Qu\'est-ce que l\'engagement représente pour vous, profondément ?',
      options: [
        { letter: 'A', text: 'Quelque chose de désirable mais qui semble toujours hors de portée.', category: 'A' },
        { letter: 'B', text: 'La forme la plus haute de l\'amour — une fusion totale.', category: 'B' },
        { letter: 'C', text: 'Une forme de piège dont il sera difficile de sortir si ça tourne mal.', category: 'C' },
        { letter: 'D', text: 'Une promesse de soutien, de présence, de dévouement.', category: 'D' },
        { letter: 'E', text: 'Quelque chose d\'important, mais que l\'autre ne semble jamais vraiment prêt à offrir.', category: 'E' },
      ],
    },
    {
      title: 'Quand l\'autre s\'éloigne ou se montre froid, que faites-vous ?',
      options: [
        { letter: 'A', text: 'Je redouble d\'effort, comme si l\'obstacle rendait l\'amour plus réel.', category: 'A' },
        { letter: 'B', text: 'Je ressens une anxiété intense. Son silence m\'envahit complètement.', category: 'B' },
        { letter: 'C', text: 'Je me dis que c\'est peut-être mieux ainsi — et je reprends de la distance.', category: 'C' },
        { letter: 'D', text: 'Je cherche à comprendre ce qui ne va pas chez lui/elle pour l\'aider.', category: 'D' },
        { letter: 'E', text: 'Je me pose la question une fois de plus : suis-je vraiment important(e) pour lui/elle ?', category: 'E' },
      ],
    },
    {
      title: 'Comment percevez-vous votre rôle dans une relation ?',
      options: [
        { letter: 'A', text: 'Je veux être celui/celle qu\'on choisit malgré les obstacles.', category: 'A' },
        { letter: 'B', text: 'Je suis entier(e) seulement à deux. L\'amour est au centre de tout.', category: 'B' },
        { letter: 'C', text: 'Je veux être présent(e) mais garder ma propre trajectoire.', category: 'C' },
        { letter: 'D', text: 'Je suis là pour l\'autre. C\'est ma manière d\'aimer.', category: 'D' },
        { letter: 'E', text: 'Je veux aimer et être aimé(e) avec la même intensité. L\'équilibre est essentiel.', category: 'E' },
      ],
    },
    {
      title: 'Laquelle de ces situations vous est la plus familière ?',
      options: [
        { letter: 'A', text: 'Attendre que quelqu\'un se libère, ou espérer que sa situation change.', category: 'A' },
        { letter: 'B', text: 'Ne plus savoir où vous finissez et où l\'autre commence.', category: 'B' },
        { letter: 'C', text: 'Trouver mille raisons de ne pas franchir le pas vers quelque chose de durable.', category: 'C' },
        { letter: 'D', text: 'Mettre l\'autre au centre, puis réaliser que vous vous êtes oublié(e).', category: 'D' },
        { letter: 'E', text: 'Avoir l\'impression de toujours courir après quelque chose qui recule.', category: 'E' },
      ],
    },
    {
      title: 'Face à quelqu\'un qui vous aime vraiment et est totalement disponible, que ressentez-vous ?',
      options: [
        { letter: 'A', text: 'De la gêne ou de la froideur. Quelque chose manque.', category: 'A' },
        { letter: 'B', text: 'De la joie, mais aussi une pression de ne pas décevoir.', category: 'B' },
        { letter: 'C', text: 'De la chaleur, mais aussi une envie de préserver mon espace.', category: 'C' },
        { letter: 'D', text: 'De l\'amour — et l\'envie de m\'assurer que lui/elle va bien.', category: 'D' },
        { letter: 'E', text: 'De la surprise. Je ne suis pas habitué(e) à ce que ce soit si simple.', category: 'E' },
      ],
    },
    {
      title: 'Quelle est, selon vous, la racine de votre façon d\'aimer ?',
      options: [
        { letter: 'A', text: 'J\'ai appris que l\'amour ne se donnait pas facilement. Il se mérite.', category: 'A' },
        { letter: 'B', text: 'Aimer fort, c\'est la seule façon que je connaisse.', category: 'B' },
        { letter: 'C', text: 'J\'ai peur de perdre ma liberté ou de souffrir si je m\'attache trop.', category: 'C' },
        { letter: 'D', text: 'Prendre soin des autres, c\'est naturel pour moi. C\'est là que je me sens utile.', category: 'D' },
        { letter: 'E', text: 'J\'ai souvent eu le sentiment de ne pas compter assez aux yeux des autres.', category: 'E' },
      ],
    },
    {
      title: 'Qu\'espérez-vous trouver en faisant ce test aujourd\'hui ?',
      options: [
        { letter: 'A', text: 'Comprendre pourquoi je choisis toujours des personnes qui ne sont pas vraiment libres.', category: 'A' },
        { letter: 'B', text: 'Comprendre pourquoi l\'amour me consume autant.', category: 'B' },
        { letter: 'C', text: 'Comprendre ce qui me fait fuir au moment où ça pourrait vraiment marcher.', category: 'C' },
        { letter: 'D', text: 'Comprendre pourquoi je donne tant sans recevoir l\'équivalent.', category: 'D' },
        { letter: 'E', text: 'Comprendre pourquoi mes relations restent en-deçà de ce que j\'espère.', category: 'E' },
      ],
    },
    {
      title: 'Qu\'est-ce qu\'une relation amoureuse réussie signifie pour vous ?',
      options: [
        { letter: 'A', text: 'Quelqu\'un qui choisit de rester malgré les obstacles, qui prouve son amour.', category: 'A' },
        { letter: 'B', text: 'Une fusion profonde, un lien qui transcende le quotidien.', category: 'B' },
        { letter: 'C', text: 'Deux personnes libres qui choisissent chaque jour de rester ensemble.', category: 'C' },
        { letter: 'D', text: 'Se soutenir mutuellement, traverser la vie ensemble en prenant soin l\'un de l\'autre.', category: 'D' },
        { letter: 'E', text: 'Un amour réciproque, visible, stable. Où l\'on se sent vraiment vu et choisi.', category: 'E' },
      ],
    },
  ],

  /* ── Les 5 résultats ── */

  results: {
    A: {
      name: 'L\'Attirance pour l\'Inaccessible',
      icon: 'star',
      tagline: 'Le schéma de la quête',
      description:
        'Vous avez développé une sensibilité particulière à ce qui est difficile d\'accès. La résistance, la distance, l\'ambiguïté — tout cela active en vous quelque chose que la disponibilité tranquille n\'active pas. Ce n\'est pas un défaut de caractère. C\'est une empreinte émotionnelle qui s\'est formée, souvent très tôt, autour de l\'idée que l\'amour se gagne — qu\'il ne peut pas être offert simplement, sans effort, sans épreuve. La conséquence : vous vous retrouvez régulièrement attirée par des personnes indisponibles — émotionnellement, physiquement, situationnellement. Et lorsque quelqu\'un de vraiment libre et présent se présente, quelque chose en vous reste froid.',
      howItWorks:
        'L\'intensité que vous ressentez pour l\'inaccessible n\'est pas de l\'amour à proprement parler — c\'est de l\'activation. Une forme d\'adrénaline émotionnelle que vous avez appris à confondre avec la passion. La bonne nouvelle : cette intensité existe en vous. Elle n\'attend que d\'être orientée vers quelqu\'un qui peut vraiment recevoir ce que vous avez à offrir.',
      signs: [
        'Attirance récurrente pour des personnes déjà prises ou émotionnellement distantes',
        'Confusion entre tension et passion, entre obstacle et preuve d\'amour',
        'Froideur ou ennui face à quelqu\'un de pleinement disponible',
        'Tendance à idéaliser la relation tant qu\'elle reste hors de portée',
        'Sentiment que l\'amour « facile » manque de profondeur',
      ],
      development: [
        'Apprendre à reconnaître la différence entre l\'excitation de la quête et la douceur d\'un lien solide',
        'Observer ce qui se passe en vous quand quelqu\'un de disponible s\'intéresse à vous — sans fuir',
        'Le calme d\'une relation disponible peut sembler fade au début : c\'est souvent le signe que vous êtes exactement là où il faut creuser',
      ],
      practices:
        'Tenez un journal de vos attirances. Notez ce qui vous attire chez chaque personne et ce qui est réellement disponible dans cette relation. Avec le temps, vous verrez le pattern se dessiner clairement.',
      affirmation:
        'Je mérite un amour qui n\'a pas besoin d\'être conquis. Je m\'ouvre à la douceur de ce qui vient à moi librement.',
    },
    B: {
      name: 'La Fusion qui Déborde',
      icon: 'flame',
      tagline: 'Le schéma de la dissolution',
      description:
        'Vous aimez avec tout votre être, sans retenue, sans calcul. C\'est l\'une de vos plus belles qualités — et aussi la source de vos blessures les plus profondes. Quand vous aimez, vous avez tendance à vous dissoudre dans l\'autre : ses besoins deviennent les vôtres, son humeur colore la vôtre, son absence vous vide. Ce schéma prend souvent racine dans une relation précoce où l\'amour et la fusion ne faisaient qu\'un — où être soi-même signifiait risquer de perdre le lien. Vous avez donc appris à disparaître un peu pour que l\'amour reste.',
      howItWorks:
        'La capacité à aimer intensément est une force rare. Le travail n\'est pas de l\'atténuer, mais d\'y ajouter quelque chose d\'essentiel : un ancrage dans votre propre identité. Aimer l\'autre sans perdre le fil de soi-même. Deux êtres distincts qui choisissent de se rejoindre — pas de se fondre.',
      signs: [
        'Perte de repères personnels en couple (goûts, amis, activités)',
        'Anxiété intense dès que l\'autre s\'éloigne ou se montre distant',
        'Tendance à adapter sa personnalité aux attentes du partenaire',
        'Difficulté à exister seul(e) sans se sentir incomplet(e)',
        'Relations passionnelles qui épuisent mais dont on ne peut se détacher',
      ],
      development: [
        'Redécouvrir ce que vous aimez, ce que vous ressentez, ce que vous voulez — indépendamment d\'une relation',
        'Non pour vous fermer, mais pour apporter quelqu\'un de complet dans votre prochaine histoire',
        'Cultiver des espaces à vous : activités, amitiés, moments de solitude choisie',
      ],
      practices:
        'Chaque semaine, faites une chose qui vous plaît uniquement à vous, sans lien avec votre partenaire. Reconnectez-vous à vos désirs propres. Ce n\'est pas de l\'égoïsme — c\'est la base d\'un amour sain.',
      affirmation:
        'Je suis entier(e) en moi-même. Mon amour est un choix, pas un besoin de complétion.',
    },
    C: {
      name: 'La Fuite avant l\'Engagement',
      icon: 'bird',
      tagline: 'Le schéma de l\'évitement',
      description:
        'Quelque chose en vous résiste au moment précis où une relation pourrait devenir vraiment solide. Ce n\'est pas un manque d\'amour. C\'est une forme de protection automatique qui s\'active quand l\'enjeu devient réel. Vous avez peut-être vécu une perte, une déception majeure, ou une relation dans laquelle vous vous êtes senti(e) pris(e) au piège. Votre système intérieur a retenu la leçon : la proximité fait mal. Alors il s\'arrange pour maintenir une sortie possible — en cherchant des défauts, en créant de la distance, ou en partant avant d\'être quitté(e).',
      howItWorks:
        'La fuite n\'est pas de la lâcheté — c\'est de l\'intelligence émotionnelle mal dirigée. Votre sensibilité est grande, et vous avez appris à la protéger coûte que coûte. Ce que vous n\'avez peut-être pas encore expérimenté pleinement, c\'est qu\'une relation saine peut aussi être un espace de sécurité — pas une cage.',
      signs: [
        'Recherche de défauts chez le partenaire dès que la relation se stabilise',
        'Besoin intense de liberté et d\'espace personnel en couple',
        'Tendance à saboter ce qui fonctionne avant que ça ne devienne « trop sérieux »',
        'Soulagement mêlé de regret après chaque rupture',
        'Attirance pour des situations relationnelles sans engagement clair',
      ],
      development: [
        'Rester. Pas par peur de partir, mais par choix conscient',
        'Observer ce qui se passe en vous au moment où l\'envie de fuir apparaît — sans pour autant lui obéir immédiatement',
        'Cet espace d\'un instant entre l\'impulsion et l\'action peut changer beaucoup de choses',
      ],
      practices:
        'La prochaine fois que l\'envie de fuir apparaît, attendez 48 heures avant d\'agir. Notez ce que vous ressentez dans votre corps, ce que vous vous dites. Souvent, l\'envie passe — et ce qui reste est plus vrai.',
      affirmation:
        'Je peux m\'engager sans me perdre. La proximité n\'est pas un danger — c\'est un choix que je fais en conscience.',
    },
    D: {
      name: 'Le Sauvetage de l\'Autre',
      icon: 'hand',
      tagline: 'Le schéma du dévouement',
      description:
        'Vous aimez en donnant. C\'est profond, c\'est sincère, et c\'est réel. Mais au fil du temps, vous vous retrouvez souvent dans des relations où vous portez davantage — la reconstruction de l\'autre, ses difficultés, sa croissance. Et vous, pendant ce temps, vous attendez votre tour qui ne vient pas toujours. Ce schéma vient souvent d\'une conviction profonde que votre valeur dans une relation se mesure à ce que vous apportez. Que pour être aimé(e), il faut être indispensable. Être aimé(e) pour ce que vous êtes — sans avoir à réparer quoi que ce soit — peut sembler moins naturel.',
      howItWorks:
        'Votre générosité est authentique. Elle ne demande pas à disparaître — elle demande à s\'équilibrer. Il est possible d\'aimer profondément sans se positionner systématiquement en soutien, en guide, en béquille. Un amour sain peut exister entre deux personnes qui n\'ont pas besoin de l\'autre pour aller bien, mais qui choisissent de partager le chemin.',
      signs: [
        'Attirance récurrente pour des personnes en difficulté ou en reconstruction',
        'Sentiment de valeur lié au fait d\'être utile ou indispensable',
        'Difficulté à recevoir de l\'aide ou du soutien en retour',
        'Épuisement émotionnel dans la plupart de vos relations',
        'Tendance à minimiser vos propres besoins au profit de ceux du partenaire',
      ],
      development: [
        'Remarquer ce que vous avez besoin de recevoir — pas seulement ce que vous pouvez donner',
        'Vous autoriser à choisir des personnes qui n\'ont pas besoin d\'être sauvées',
        'Accepter d\'être aimé(e) pour qui vous êtes, pas pour ce que vous faites',
      ],
      practices:
        'Avant de dire oui à une demande, posez-vous cette question : est-ce que je fais ça par amour, ou par peur de ne plus être aimé(e) si j\'arrête de donner ? La réponse honnête est le début du changement.',
      affirmation:
        'Je suis digne d\'amour tel(le) que je suis, sans avoir besoin de sauver qui que ce soit pour le mériter.',
    },
    E: {
      name: 'L\'Amour à Sens Unique',
      icon: 'heart-crack',
      tagline: 'Le schéma du manque de réciprocité',
      description:
        'Vous donnez, vous attendez, vous espérez — et souvent, la réciprocité que vous cherchez ne vient pas tout à fait, ou pas sous la forme que vous attendiez. Vous avez l\'habitude de compenser le manque de l\'autre, de vous ajuster à quelqu\'un qui ne fait pas toujours le même chemin. Ce schéma prend souvent racine dans des expériences où votre présence, vos besoins ou vos émotions ont été minimisés. Vous avez intégré, parfois sans le savoir, que l\'amour était quelque chose que l\'on devait réclamer — pas quelque chose que l\'on recevait naturellement.',
      howItWorks:
        'Vous méritez un amour qui ne demande pas à être surveillé, négocié, ou arraché. Votre sensibilité à la réciprocité est juste — c\'est une boussole, pas une exigence excessive. Le défi n\'est pas de baisser vos attentes, mais de vous tourner vers des personnes capables d\'y répondre.',
      signs: [
        'Impression récurrente d\'aimer plus que l\'on n\'est aimé(e)',
        'Tendance à s\'adapter, à attendre, à excuser le manque d\'investissement de l\'autre',
        'Difficulté à poser des limites par peur de perdre le lien',
        'Sensation d\'invisibilité dans la relation malgré tout ce que vous donnez',
        'Habitude de rester dans des relations déséquilibrées en espérant que ça change',
      ],
      development: [
        'Renoncer progressivement aux relations où vous devez prouver votre valeur',
        'Non par fierté, mais par connaissance de vous-même',
        'Vous avez quelque chose de précieux à offrir — le but est de le donner à quelqu\'un qui en prend soin',
      ],
      practices:
        'Faites la liste de ce que vous apportez dans vos relations, puis celle de ce que vous recevez. Si le déséquilibre est flagrant, ce n\'est pas vous qui donnez trop — c\'est que vous n\'êtes pas avec la bonne personne.',
      affirmation:
        'Je mérite un amour qui vient vers moi avec autant de force que celui que je donne. Je choisis la réciprocité.',
    },
  },
};

const test: TestProfils | TestScore = quizConfig;
export default test;
