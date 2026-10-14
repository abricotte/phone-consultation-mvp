// Test porté du site elena-wolska.com (ressources gratuites, page « test-flamme-jumelle »), texte d'Elena.
// Les données seulement : le composant est components/TestSpirituel.tsx.
/* eslint-disable */
import type { TestProfils, TestScore, QuestionProfil } from './types';

const QUESTIONS: { title: string; F: string; A: string; E: string; M: string }[] = [
  {
    title: 'Votre première rencontre, c’était…',
    F: 'Une évidence immédiate, comme si vous vous connaissiez déjà.',
    A: 'Une douceur qui s’est installée petit à petit, en confiance.',
    E: 'Une rencontre qui vous a tout de suite donné envie d’avancer.',
    M: 'Une curiosité : cette personne vous intriguait, sans savoir pourquoi.',
  },
  {
    title: 'Quand vous regardez cette personne, vous voyez…',
    F: 'Quelqu’un que votre cœur semble connaître depuis toujours.',
    A: 'Un partenaire, quelqu’un avec qui construire.',
    E: 'Quelqu’un qui vous pousse à donner le meilleur de vous.',
    M: 'Des qualités que vous avez envie de faire fleurir en vous.',
  },
  {
    title: 'Entre vous, les échanges…',
    F: 'Se passent presque de mots : un regard suffit.',
    A: 'Coulent avec facilité, on parle de tout et on rit de rien.',
    E: 'Vous apprennent toujours quelque chose, à l’un comme à l’autre.',
    M: 'Vous montrent qui vous êtes vraiment.',
  },
  {
    title: 'Quand vous pensez à cette personne, vous ressentez…',
    F: 'Une joie profonde, comme si une part de vous s’illuminait.',
    A: 'Une douce chaleur, un sentiment de paix.',
    E: 'De l’admiration pour tout ce qu’elle vous apprend.',
    M: 'L’envie de mieux vous connaître.',
  },
  {
    title: 'Ce lien a changé votre vie parce que…',
    F: 'Vous vous sentez plus vous-même que jamais.',
    A: 'Il vous apporte sécurité et tendresse.',
    E: 'Il vous a fait franchir de belles étapes.',
    M: 'Il vous a donné envie de prendre soin de vous.',
  },
  {
    title: 'Quand vous êtes loin l’un de l’autre…',
    F: 'Vous sentez un fil invisible qui ne se coupe jamais.',
    A: 'Vous vous manquez doucement, en sachant que vous vous retrouverez.',
    E: 'Vous repensez à ce que vous vous êtes appris.',
    M: 'Vous en profitez pour vous retrouver, vous.',
  },
  {
    title: 'Votre histoire ressemble à…',
    F: 'Des retrouvailles.',
    A: 'Un jardin qu’on cultive à deux.',
    E: 'Une belle école de vie, à deux.',
    M: 'Un voyage vers vous-même.',
  },
  {
    title: 'Ce qui vous rapproche le plus…',
    F: 'L’envie d’apporter ensemble quelque chose de beau au monde.',
    A: 'Les projets du quotidien, la maison, les rires partagés.',
    E: 'Tout ce que vous avez traversé et réussi ensemble.',
    M: 'Ce que vous découvrez de vous grâce à l’autre.',
  },
  {
    title: 'Ce lien, en un mot :',
    F: 'Évidence.',
    A: 'Tendresse.',
    E: 'Évolution.',
    M: 'Révélation.',
  },
  {
    title: 'Aujourd’hui, ce que vous souhaitez le plus…',
    F: 'Vivre pleinement cette connexion rare.',
    A: 'Construire un amour serein et durable.',
    E: 'Comprendre tout ce que cette histoire vous apporte.',
    M: 'Vous aimer vous-même autant que vous aimez l’autre.',
  },
];

const ORDRES = ['FAEM', 'AMFE', 'EFMA', 'MEAF', 'FMAE', 'AEFM', 'EAMF', 'MFEA', 'FEAM', 'AFME'];

const questions: QuestionProfil[] = QUESTIONS.map((q, i) => ({
  title: q.title,
  options: ORDRES[i].split('').map((k, j) => ({
    letter: 'ABCD'[j],
    text: q[k as 'F' | 'A' | 'E' | 'M'],
    category: k,
  })),
}));

/* ── Bloc final : La Petite Pythie et le formulaire ── */

/* ── Configuration du test ── */

// Les cartes de la Petite Pythie (peintes par Elena) et les liens, version espace.
const carte = (nom: string, titre: string) => ({
  src: `/images/pythie/${nom}.webp`,
  alt: `${titre}, carte de La Petite Pythie peinte par Elena Wolska`,
  width: 480,
  height: 823,
});
const liensContrats = [
  { href: '/etudes', label: 'Les 12 contrats d’âme — Méthode Wolska' },
  { href: '/tests/contrat-dame', label: 'Faire le test : quel est mon contrat d’âme ?' },
];

const quizConfig: TestProfils = {
  mode: 'profils',
  slug: 'flamme-jumelle',
  title: 'Est-ce votre flamme jumelle ?',
  subtitle: '10 questions pour découvrir la nature de votre lien',
  tag: '10 questions · 4 profils',


  intro: [
    'Certaines rencontres ont quelque chose d’unique&nbsp;: on a l’impression de se reconnaître, de se comprendre, de s’éveiller. Mais est-ce une <strong>flamme jumelle</strong>, une <strong>âme sœur</strong>, ou l’un de ces beaux contrats d’âme qui nous font grandir&nbsp;?',
    'Répondez avec votre cœur, sans trop réfléchir. Il n’y a pas de bonne ou de mauvaise réponse&nbsp;: chaque lien d’amour est un cadeau.',
    '<strong>Belle découverte&nbsp;!</strong>',
  ],

  fallbackCategory: '_',

  spiritualMessage:
    'Chaque lien d’amour est un cadeau. Qu’il soit évidence, tendresse, apprentissage ou révélation, il vous rapproche de la plus belle personne à rencontrer : vous-même.',
  spiritualMessageFallback: '',

  labels: {
    secondaryTitle: 'Une autre couleur de votre lien',
    secondaryDescription: 'Cette couleur est elle aussi présente dans votre histoire, et la rend encore plus riche.',
    profileTitle: 'Les couleurs de votre lien',
    ctaDescription: 'Envie d’une lecture vraiment personnelle de votre lien ? Je suis là en consultation.',
  },

  questions,

  results: {
    F: {
      name: 'Une flamme jumelle',
      icon: 'flame',
      tagline: 'Une évidence lumineuse',
      image: carte('la-flamme-jumelle', 'La Flamme jumelle'),
      description:
        'Vous n’avez pas vraiment rencontré cette personne : vous l’avez reconnue. Entre vous, il y a une évidence rare, une complicité qui se passe de mots et de jolies coïncidences qui font sourire. La flamme jumelle ne vient pas vous compléter, elle vous éveille à vous-même. Elle révèle votre lumière, votre liberté et votre vérité. C’est l’un des 12 contrats d’âme, le Contrat de Flamme Jumelle, et l’un des plus beaux.',
      links: [{ href: '/etudes', label: 'Découvrir les 12 contrats d’âme' }],
    },
    A: {
      name: 'Une âme sœur',
      icon: 'heart',
      tagline: 'Un amour qui fait du bien',
      image: carte('le-grand-amour', 'Le Grand Amour'),
      description:
        'Votre lien est fait de douceur, de complicité et de projets. Avec cette personne, vous pouvez être pleinement vous-même, rire de tout et construire jour après jour. L’âme sœur, c’est un amour qui rassure et qui fleurit avec le temps, comme un jardin qu’on cultive à deux. C’est un vrai trésor.',
      links: [{ href: '/tests/quel-amour-vous-attend', label: 'Faire le test : quel amour vous attend ?' }],
    },
    E: {
      name: 'Le Contrat d’Enseignement',
      icon: 'graduation-cap',
      tagline: 'Vous grandissez ensemble',
      image: carte('le-contrat-d-ame', 'Le Contrat d’âme'),
      description:
        'Ce lien fait partie des 12 contrats d’âme : c’est le Contrat d’Enseignement. Chacun de vous apprend à l’autre quelque chose de précieux, à tour de rôle : une façon d’aimer, d’oser, de voir le monde. Cette histoire vous met en mouvement. Elle vous aide à savoir ce que vous voulez, et vous fait avancer avec plus de sagesse et de confiance.',
      links: liensContrats,
    },
    M: {
      name: 'Le Contrat Miroir',
      icon: 'sparkles',
      tagline: 'Une rencontre qui vous révèle',
      image: carte('le-rendez-vous', 'Le Rendez-vous'),
      description:
        'Ce lien fait partie des 12 contrats d’âme : c’est le Contrat Miroir. Cette personne vous renvoie votre propre beauté, vos talents et vos envies profondes. Ce que vous admirez chez elle existe aussi en vous. Le plus beau cadeau de ce lien, c’est de mieux vous connaître et de vous aimer davantage.',
      links: liensContrats,
    },
  },

};

const test: TestProfils | TestScore = quizConfig;
export default test;
