"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import EspaceShell from "@/components/EspaceShell";
import { Bientot, Filet } from "@/components/Ornements";
import { SIGNES_LISTE, signeAstrologique, signeParCode } from "@/lib/astro";

// MES ÉTUDES — Méthode Wolska, en plus simple (Elena, 14 octobre, tard).
// Une phrase d'invitation ; « Qui suis-je ? » avec une part offerte (ce qui
// se trouve partout en ligne : le signe, l'ascendant, les compatibilités,
// et le thème astral à venir) ; puis les études complètes, payantes — les
// tarifs sont à décider par Elena, donc aucun prix n'est affiché ; et la
// carte des sagesses du monde. On ne donne pas les clés de la méthode.

// ── Les compatibilités, par élément : la lecture classique, celle qu'on
// trouve partout. Ce qui est propre à la cliente, c'est l'étude.
const ELEMENT: Record<string, "Feu" | "Terre" | "Air" | "Eau"> = {
  Bélier: "Feu", Lion: "Feu", Sagittaire: "Feu",
  Taureau: "Terre", Vierge: "Terre", Capricorne: "Terre",
  Gémeaux: "Air", Balance: "Air", Verseau: "Air",
  Cancer: "Eau", Scorpion: "Eau", Poissons: "Eau",
};
const ACCORDS: Record<string, string> = {
  "Feu-Feu": "Deux feux : beaucoup d'élan, de la passion, et le risque de se consumer vite. On apprend à laisser l'autre briller.",
  "Feu-Terre": "Le feu veut partir, la terre veut rester. Ça frotte — et ça construit, si chacun garde sa place.",
  "Feu-Air": "L'air attise le feu : une complicité vive, des projets, des conversations qui n'en finissent pas.",
  "Feu-Eau": "L'eau peut éteindre le feu, le feu peut faire bouillir l'eau : un lien intense, qui demande de la douceur.",
  "Terre-Terre": "Deux terres : la solidité, la fidélité, le quotidien bien tenu. À garder vivant par un peu de surprise.",
  "Terre-Air": "La terre ancre, l'air s'envole. Un lien qui apprend la patience aux deux.",
  "Terre-Eau": "L'eau nourrit la terre : la tendresse, la sécurité, le foyer. Un des accords les plus doux.",
  "Air-Air": "Deux airs : les idées, la liberté, les mots. Le cœur suit, à condition de se poser parfois.",
  "Air-Eau": "L'air pense, l'eau ressent. Beaucoup à s'apprendre, à condition de se traduire l'un à l'autre.",
  "Eau-Eau": "Deux eaux : une entente intuitive, presque sans mots. Veiller à ne pas se noyer dans les émotions de l'autre.",
};
function accord(a: string, b: string): string {
  const ea = ELEMENT[a], eb = ELEMENT[b];
  return ACCORDS[`${ea}-${eb}`] ?? ACCORDS[`${eb}-${ea}`] ?? "";
}

// ── Les études complètes, rangées par la question que l'on se pose. Pas de
// prix : Elena les fixe. Pas de nombre de pages, pas de « relue et signée ».
type Etude = { titre: string; accroche: string; pour: string };
const QUESTIONS: { titre: string; intro: string; teinte: string; etudes: Etude[] }[] = [
  { titre: "Qui suis-je ?", intro: "Ce que vous êtes venue apprendre en amour, et par quel chemin.", teinte: "border-[#DED6EC] bg-[#F1EDF8]", etudes: [
    { titre: "Votre contrat d'âme", accroche: "Vous donnez trop vite, ou trop tard ?", pour: "Ce que votre âme a choisi d'apprendre en amour, et ce qui se répète tant que ce n'est pas appris." },
    { titre: "Votre famille d'âme", accroche: "Gardienne, passeuse, tisseuse de liens, éclaireuse ?", pour: "L'archétype qui vous porte, son don, son ombre, la blessure qu'il protège." },
    { titre: "Votre schéma amoureux", accroche: "Ce que vous répétez, sans le vouloir.", pour: "Votre test spirituel, déplié : le schéma qui revient d'une histoire à l'autre, d'où il vient, et par quoi il se défait." },
    { titre: "Le prénom de votre âme", accroche: "Le prénom reçu, et celle que vous êtes.", pour: "Votre contrat d'âme enrichi de votre prénom — et une lettre écrite par l'âme de votre prénom." },
  ] },
  { titre: "Qui est-il, qui est-elle, qui sont-iels ?", intro: "Sa date, son prénom. Sa façon d'aimer, de fuir, de revenir. La question que l'on me pose le plus.", teinte: "border-[#EAD6DF] bg-[#F8EDF2]", etudes: [
    { titre: "L'autre, par ses dates", accroche: "Pourquoi il se tait quand vous parlez ?", pour: "Sa manière d'aimer et de recevoir l'amour. Ce que ses dates disent, et qu'il ne dit pas." },
    { titre: "Comprendre son caractère", accroche: "Pourquoi il réagit comme ça ?", pour: "Ce qui le rassure, ce qui le ferme, comment il décide, comment il se fâche et comment il revient. Pour l'aimer sans vous perdre." },
    { titre: "Son année", accroche: "Est-ce le moment, pour lui ?", pour: "L'année qu'il ou elle traverse : ce qui le pousse, ce qui le retient, le moment où il peut venir vers vous." },
    { titre: "Son prénom", accroche: "Ce que son prénom porte, et qu'il ignore lui-même.", pour: "D'où il vient, ce qu'il a traversé, sa lecture symbolique — une autre façon de le connaître." },
  ] },
  { titre: "Notre lien", intro: "Pourquoi lui. Pourquoi encore ça. Ce qui vous lie, et ce que ça demande de vous.", teinte: "border-[#F0D9D3] bg-[#FBEFEB]", etudes: [
    { titre: "Votre contrat d'âme à deux", accroche: "Lequel des douze contrats vous lie ?", pour: "Le contrat, la vibration de votre couple, la phase où vous en êtes — et la suivante." },
    { titre: "Les nœuds de votre lien", accroche: "Vous vous êtes déjà connus ?", pour: "Le récit de ce que vos âmes ont déjà traversé ensemble." },
    { titre: "Votre contrat avec votre enfant, votre mère, votre amie", accroche: "Pourquoi c'est si fort, avec elle ?", pour: "Le même contrat d'âme, pour un autre lien. Ce que vous êtes venues apprendre l'une de l'autre." },
    { titre: "Le triangle", accroche: "L'ex, la tierce, l'enfant : qui tient quelle place ?", pour: "Trois liens croisés, la place de chacun, ce qui se rejoue — et ce qui peut se dénouer." },
  ] },
  { titre: "Mon chemin", intro: "L'année, les seuils, le mythe que vous traversez. Pour savoir ce qui vient, vous m'appelez.", teinte: "border-[#EAD9B4] bg-[#FBF3E2]", etudes: [
    { titre: "L'almanach de votre année", accroche: "Votre année, lue par quatre calendriers.", pour: "Quatre rubriques séparées, jamais fondues, pour les douze mois qui viennent." },
    { titre: "Les portes de votre vie", accroche: "Trente ans, quarante ans : ce qui bascule.", pour: "Les grands seuils. Ce qui doit se terminer, ce qui demande à naître." },
    { titre: "Le mythe que vous traversez", accroche: "Perséphone, Psyché, Ariane, Isis : laquelle est en vous ?", pour: "Le mythe miroir de ce que vous vivez, l'étape où vous êtes, le passage à accomplir." },
  ] },
  { titre: "D'où je viens ?", intro: "Votre prénom, votre lignée, vos mémoires d'avant. Ce que vous avez reçu avant de choisir.", teinte: "border-[#D3E0D2] bg-[#EDF4EC]", etudes: [
    { titre: "Votre prénom en amour", accroche: "Qui vous a nommée, et pourquoi ?", pour: "D'où il vient, comment il a voyagé, ce qu'il porte — et sa lecture symbolique, à part." },
    { titre: "L'arbre secret des prénoms", accroche: "Trois générations, un prénom qui revient.", pour: "Ce qui se transmet, ce qui s'efface, ce qui se répare. D'après ce que vous racontez." },
    { titre: "Les archives de votre âme", accroche: "Ce que vous auriez déjà vécu.", pour: "Un récit symbolique de vos vies anciennes — un récit, jamais un fait." },
  ] },
];

// ── La carte des sagesses du monde. Positions en % de l'image.
type Civ = { cle: string; nom: string; lieu: string; epoque: string; methodes: [string, string][]; pistes: string[]; x: number; y: number; texte: string; statut: string; aVenir?: boolean; etudes: Etude[] };
const MONDE: Civ[] = [
  { cle: "mesopotamie", nom: "Mésopotamie", lieu: "Sumer, Akkad, Babylone", epoque: "IIIe–Ier millénaire av. J.-C.", methodes: [["Le ciel", "séries de présages"], ["Les rêves", "manuels d'interprétation"], ["L'huile sur l'eau", "la forme qu'elle prend"]], pistes: ["La tablette de présages du foie, en argile, au British Museum (vers 2000 av. J.-C.)", "La grande série Enūma Anu Enlil, des milliers de présages du ciel", "Le musée du Louvre, département des Antiquités orientales"], x: 58.5, y: 40.5, statut: "adaptation d'après les tablettes de présages", texte: "Les premiers à écrire le ciel : si tel signe paraît à tel moment, alors… Une tablette pour votre question.", etudes: [{ titre: "La tablette de votre destinée", accroche: "Un présage à la manière des scribes.", pour: "Votre ciel du jour de naissance, votre question, et la réponse écrite comme on l'écrivait : si… alors." }] },
  { cle: "egypte", nom: "Égypte", lieu: "Thèbes", epoque: "IIIe millénaire–Ier siècle av. J.-C.", methodes: [["Le nom", "une part de l'être"], ["Les rêves", "le papyrus Chester Beatty"], ["Le calendrier", "jours fastes et néfastes"]], pistes: ["Le papyrus Chester Beatty III, manuel des rêves, au British Museum", "Le récit d'Isis et du nom secret de Rê, papyrus de Turin", "Dendérah et son plafond zodiacal, au Louvre"], x: 56.5, y: 44.5, statut: "d'après le manuel des rêves et les noms sacrés", texte: "Le nom comme une part de l'être, le rêve comme une lettre des dieux.", etudes: [{ titre: "Elena lit votre rêve", accroche: "Racontez-le, elle vous répond.", pour: "La scène, l'action, la rencontre, la direction, la sensation : la grille des anciens, et la lecture d'Elena." }, { titre: "Vos trois noms", accroche: "Public, intime, secret.", pour: "Celui que tout le monde dit, celui des proches, et celui que vous choisissez pour vous seule." }] },
  { cle: "grece", nom: "Grèce", lieu: "Delphes, Délos", epoque: "VIIIe siècle av. J.-C.–Antiquité tardive", methodes: [["Les lettres", "chaque lettre, un nombre"], ["Les noms", "comparés deux à deux"], ["Les osselets", "cinq os, 56 réponses"]], pistes: ["Delphes, le sanctuaire de la Pythie, et Délos, l'île d'Apollon", "Le monument-oracle de Kibyra, en Turquie, et ses 56 réponses gravées", "L'isopséphie : les graffitis de Pompéi qui comptent un nom"], x: 54, y: 38, statut: "attesté : lettres et nombres, oracle aux osselets", texte: "Là où mes cartes ont été consacrées. Les Grecs comptaient les lettres des noms et les comparaient.", etudes: [{ titre: "La résonance de vos deux prénoms", accroche: "Vos deux noms, comptés comme à Delphes.", pour: "Chaque prénom transcrit en grec, son nombre, et la carte de vos résonances : ce qui s'accorde, ce qui se complète, ce qui se répète." }, { titre: "Le mythe que vous traversez", accroche: "Laquelle est en vous ?", pour: "Perséphone, Psyché, Ariane, Isis : le mythe miroir de ce que vous vivez." }] },
  { cle: "perse", nom: "Perse", lieu: "feu, étoiles et destin", epoque: "Ier millénaire av. J.-C.–aujourd'hui", methodes: [["Le feu", "observé par les mages"], ["Les astres", "les éclipses, les présages"], ["Le poème", "le Divan de Hâfez ouvert au hasard"]], pistes: ["Le Divan de Hâfez, et le fāl-e Hāfez que l'on pratique encore à Chiraz", "Persépolis, et les mages qui lisaient les éclipses", "Le feu toujours allumé du temple de Yazd"], x: 63.5, y: 39.5, statut: "d'après une pratique vivante : le fāl-e Hāfez", texte: "On ouvre le recueil de Hâfez au hasard, et le vers répond à la question. Les Persans le font depuis six siècles.", etudes: [{ titre: "Le vers de Hâfez", accroche: "Posez votre question, un poème vous répond.", pour: "Elena ouvre le Divan pour vous, photographie la page, et vous écrit ce que le vers dit de votre question." }] },
  { cle: "nord", nom: "Scandinavie", lieu: "runes, prophétesses et destin", epoque: "VIIIe–XIe siècle", methodes: [["Les runes", "une écriture, 24 signes"], ["Les lots", "trois bois tirés sur un drap blanc"], ["Les prophétesses", "le destin dit à voix haute"]], pistes: ["La Germania de Tacite, chapitre 10 : trois bois tirés sur un drap blanc", "Les pierres runiques de Jelling, au Danemark, et de Rök, en Suède", "Le Poème runique anglo-saxon, chaque lettre et son vers"], x: 53, y: 23, statut: "tirage contemporain, à la main — dit comme tel", texte: "Les runes étaient une écriture, gravée pour nommer et pour se souvenir. Elena en tire trois pour vous.", etudes: [{ titre: "Le tirage de runes", accroche: "Trois runes, tirées à la main, pour votre question.", pour: "Elena tire trois runes, les photographie, et vous écrit leur lecture — ce qui est posé, ce qui travaille, ce qui demande à être entendu." }] },
  { cle: "inde", nom: "Inde", lieu: "les 27 demeures lunaires", epoque: "IIe millénaire av. J.-C.–aujourd'hui", methodes: [["La Lune", "27 demeures"], ["Les quarts", "108 positions"], ["Le prénom", "la syllabe de naissance"]], pistes: ["Les Gṛhyasūtra, où le rite de nomination suit la Lune", "Le ciel des 27 nakshatra, et leur syllabe de naissance", "L'observatoire du Jantar Mantar, à Jaipur"], x: 72.5, y: 45.5, statut: "reconstitué : il faut l'heure et le lieu", texte: "La Lune plus que le Soleil : la demeure où elle se tenait à votre naissance donne la syllabe de votre nom.", etudes: [{ titre: "La demeure de votre Lune", accroche: "Votre nakshatra, et sa syllabe.", pour: "La demeure lunaire de votre naissance, sa divinité, son symbole, votre façon d'entrer en relation." }] },
  { cle: "tibet", nom: "Tibet", lieu: "dés, présages et voie intérieure", epoque: "VIIIe siècle–aujourd'hui", methodes: [["Les dés", "trois jets, 64 réponses"], ["Le chapelet", "compté au hasard"], ["Les rêves", "présages du matin"]], pistes: ["Les manuscrits de Dunhuang, à la British Library : trois dés, 64 réponses", "Le Mo, l'oracle des dés que l'on consulte encore à Lhassa", "Les lampes à beurre et les chapelets comptés au hasard"], x: 70, y: 40.5, statut: "attesté : trois dés, 64 réponses (manuscrits de Dunhuang)", texte: "Trois dés jetés, soixante-quatre réponses écrites il y a mille ans.", etudes: [{ titre: "Les dés du Tibet", accroche: "Trois dés, une réponse ancienne.", pour: "Elena jette les dés pour votre question, et vous transmet la réponse du manuscrit, puis la sienne." }] },
  { cle: "chine", nom: "Chine", lieu: "les quatre piliers", epoque: "XIVe siècle av. J.-C.–aujourd'hui", methodes: [["Les os", "fissures sous la chaleur"], ["Le Livre des mutations", "64 hexagrammes"], ["Les huit caractères", "année, mois, jour, heure"]], pistes: ["Les os oraculaires d'Anyang, et le musée national de Pékin", "Le Yijing, le Livre des mutations, et ses 64 hexagrammes", "Les quatre piliers que l'on comparait avant un mariage"], x: 77.5, y: 43.5, statut: "attesté : les huit caractères", texte: "Bien au-delà de l'animal de l'année : huit caractères pour une naissance, que l'on comparait avant un mariage.", etudes: [{ titre: "Les huit caractères de votre destinée", accroche: "Ce que l'on comparait avant de se marier.", pour: "Vos quatre piliers, le maître du jour, l'équilibre des cinq mouvements." }] },
  { cle: "maya", nom: "Mésoamérique", lieu: "Maya, Mexica — le calendrier de 260 jours", epoque: "Ier millénaire av. J.-C.–aujourd'hui", methodes: [["Le calendrier", "260 jours"], ["Les signes", "20 gardiens du jour"], ["Les nombres", "de 1 à 13"]], pistes: ["Le codex de Dresde, l'un des quatre livres mayas conservés", "Chichén Itzá et l'observatoire du Caracol", "Les 260 jours du tzolk'in, que les Maya du Guatemala comptent encore"], x: 24, y: 46, statut: "reconstitué : la corrélation est affichée", texte: "Treize nombres et vingt signes : le gardien du jour où vous êtes née, sa direction, sa couleur.", etudes: [{ titre: "Le gardien de votre jour", accroche: "Votre signe, votre nombre, votre jour sacré.", pour: "Votre jour dans le calendrier de 260 jours, son gardien, et le jour où il revient." }] },
  { cle: "irlande", nom: "Irlande", lieu: "ogham, poésie et mémoire", epoque: "Antiquité tardive–Moyen Âge", methodes: [["L'ogham", "vingt lettres-arbres"], ["La poésie", "le savoir inspiré"], ["La nature", "présages et cycles"]], pistes: ["Les pierres oghamiques du Kerry et du Cork", "Le Livre de Ballymote et son traité des oghams", "Newgrange, où le solstice entre dans la chambre"], x: 46.5, y: 29, aVenir: true, statut: "à venir", texte: "Les lettres-arbres gravées sur les pierres, et ce que les poètes en ont fait.", etudes: [] },
  { cle: "madagascar", nom: "Madagascar", lieu: "la matrice des graines", epoque: "tradition vivante", methodes: [["Les graines", "pair ou impair"], ["Les figures", "seize"], ["La matrice", "mères, filles, juge"]], pistes: ["Le sikidy et ses seize figures, chez les Antemoro et les Sakalava", "La matrice des graines, mères, filles et juge"], x: 60.5, y: 65, aVenir: true, statut: "à venir", texte: "Des graines réparties, pair ou impair, seize figures : un tirage que l'on calcule.", etudes: [] },
  { cle: "andes", nom: "Andes", lieu: "coca, montagnes et oracles", epoque: "précolombien–aujourd'hui", methodes: [["La coca", "la face et le sens des feuilles"], ["Les sanctuaires", "les oracles des huacas"], ["Les montagnes", "les ancêtres du territoire"]], pistes: ["La lecture des feuilles de coca, coca qhaway, dans les Andes d'aujourd'hui", "Les huacas, sanctuaires-oracles de l'Empire inca", "Machu Picchu et la pierre qui attache le Soleil"], x: 27, y: 66, aVenir: true, statut: "à venir", texte: "Les feuilles tombées sur le tissu, leur face, leur sens, leur place.", etudes: [] },
];

function CarteEtude({ e, teinte }: { e: Etude; teinte: string }) {
  return (
    <li className={`flex flex-col rounded-[20px] border px-5 pb-5 pt-5 ${teinte}`}>
      <p className="font-serif text-[21px] font-semibold leading-tight text-aubergine">{e.titre}</p>
      <p className="mt-1.5 font-serif text-[16px] italic leading-snug text-ink">{e.accroche}</p>
      <p className="mt-2.5 text-[13px] leading-relaxed text-ink/70">{e.pour}</p>
    </li>
  );
}

export default function EtudesPage() {
  type ProfilEtudes = { prenom: string | null; dateNaissance: string | null; ascendant: string | null; heureNaissance?: string | null; lieuNaissance?: string | null };
  const [profil, setProfil] = useState<ProfilEtudes | null>(null);
  const [autre, setAutre] = useState<string>("");
  const [pays, setPays] = useState<string>("grece");

  useEffect(() => {
    api.getProfil()
      .then((d: ProfilEtudes) => setProfil(d))
      .catch(() => setProfil({ prenom: null, dateNaissance: null, ascendant: null }));
  }, []);
  const themePret = !!(profil?.dateNaissance && profil?.heureNaissance && profil?.lieuNaissance);

  const signe = signeAstrologique(profil?.dateNaissance);
  const ascendant = signeParCode(profil?.ascendant);
  const civ = MONDE.find((m) => m.cle === pays)!;

  return (
    <EspaceShell>
      <header className="mb-8 max-w-2xl">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Mes études</p>
        <h1 className="mt-1 font-serif text-4xl font-semibold leading-tight text-aubergine md:text-[46px]">
          Méthode Wolska
        </h1>
        <p className="mt-3 font-serif text-xl italic leading-relaxed text-mention">
          Je vous propose d&apos;apprendre à mieux vous connaître, et à mieux connaître vos proches, suivant la méthode Wolska.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
          Une part vous est offerte ici. Les études complètes sont calculées d&apos;après ma méthode, relues et signées par
          moi, et vous sont remises dans votre espace.
        </p>
      </header>

      {/* ── Qui suis-je ? — la part offerte ── */}
      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[32px] font-semibold leading-tight text-aubergine">Qui suis-je ?</h2>
          <span className="rounded-full bg-gold/15 px-3 py-1 text-[12px] font-semibold text-gold-dark">offert</span>
        </div>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-[20px] border border-[#DED6EC] bg-[#F1EDF8] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Votre signe</p>
            {signe ? (
              <p className="mt-2 font-serif text-[30px] font-semibold leading-tight text-aubergine">
                <span className="mr-2 text-gold-dark">{signe.emoji}</span>{signe.nom}
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-ink/80">
                Renseignez votre date de naissance dans{" "}
                <a href="/profil" className="font-semibold text-prix hover:underline">Mon profil</a>.
              </p>
            )}
          </li>
          <li className="rounded-[20px] border border-[#DED6EC] bg-[#F1EDF8] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Votre ascendant</p>
            {ascendant ? (
              <p className="mt-2 font-serif text-[30px] font-semibold leading-tight text-aubergine">
                <span className="mr-2 text-gold-dark">{ascendant.emoji}</span>{ascendant.nom}
              </p>
            ) : (
              <p className="mt-2 text-[14px] text-ink/80">
                Si vous le connaissez, notez-le dans{" "}
                <a href="/profil" className="font-semibold text-prix hover:underline">Mon profil</a>. Sinon, on le calculera avec votre heure de naissance.
              </p>
            )}
          </li>
          <li className="rounded-[20px] border border-[#DED6EC] bg-[#F1EDF8] p-5 sm:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Vos compatibilités</p>
            <label className="mt-2 block text-[14px] text-ink/80">
              {signe ? `${signe.nom} et…` : "Votre signe et…"}
              <select
                value={autre}
                onChange={(e) => setAutre(e.target.value)}
                className="ml-2 rounded-full border border-greige bg-white px-3 py-1.5 text-[14px] text-ink"
              >
                <option value="">choisir un signe</option>
                {SIGNES_LISTE.map((s) => (
                  <option key={s.code} value={s.nom}>{s.emoji} {s.nom}</option>
                ))}
              </select>
            </label>
            {signe && autre ? (
              <p className="mt-3 text-[14px] leading-relaxed text-ink/85">{accord(signe.nom, autre)}</p>
            ) : (
              <p className="mt-3 text-[13px] text-mention">
                {signe ? "Choisissez le signe de l'autre." : "Votre date de naissance d'abord, dans Mon profil."}
              </p>
            )}
            <p className="mt-2 text-[12px] italic text-mention">La lecture par élément — celle que l&apos;on trouve partout. Ce qui n&apos;est qu&apos;à vous deux, c&apos;est l&apos;étude.</p>
          </li>
          <li className={`rounded-[20px] border p-5 sm:col-span-2 lg:col-span-4 ${themePret ? "border-gold/40 bg-gradient-to-br from-[#FBF3E2] to-ivory" : "border-dashed border-gold/40 bg-ivory/60"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Votre thème astral</p>
            <p className="mt-2 text-[14px] leading-relaxed text-ink/85">
              On l&apos;appelle aussi <span className="font-semibold text-aubergine">la carte du ciel</span> : la position du Soleil, de la Lune et des planètes à
              l&apos;heure et au lieu exacts de votre naissance — les sept astres des Anciens, l&apos;ascendant, les douze lieux, les aspects.
            </p>
            {themePret ? (
              <a href="/etudes/theme-astral" className="mt-3 inline-flex items-center gap-2 rounded-full bg-aubergine px-5 py-2.5 text-[14px] font-semibold text-cream hover:bg-aubergine/90">
                Voir mon thème astral <span aria-hidden>→</span>
              </a>
            ) : profil?.dateNaissance ? (
              <p className="mt-3 text-[14px] text-ink/80">
                Il vous manque {!profil?.heureNaissance && !profil?.lieuNaissance ? "votre heure et votre lieu" : !profil?.heureNaissance ? "votre heure" : "votre lieu"} de naissance :{" "}
                <a href="/profil" className="font-semibold text-prix hover:underline">les noter dans Mon profil</a>.{" "}
                <a href="/etudes/theme-astral" className="text-mention hover:underline">Sans l&apos;heure, voir les planètes en signes →</a>
              </p>
            ) : (
              <p className="mt-3 text-[14px] text-ink/80">
                Votre date de naissance d&apos;abord, puis l&apos;heure et le lieu, dans{" "}
                <a href="/profil" className="font-semibold text-prix hover:underline">Mon profil</a>.
              </p>
            )}
          </li>
        </ul>
      </section>

      <Filet />

      {/* ── Les études complètes — payantes, prix à venir ── */}
      <section>
        <h2 className="font-serif text-[32px] font-semibold leading-tight text-aubergine">Pour aller plus loin</h2>
        <p className="mt-2 max-w-2xl font-serif text-lg italic leading-relaxed text-mention">
          Les études complètes, par la question que vous vous posez. Sur vous, sur l&apos;autre, sur vous deux, sur votre chemin,
          sur d&apos;où vous venez.
        </p>
        {QUESTIONS.map((q) => (
          <div key={q.titre} className="mt-8">
            <h3 className="font-serif text-[24px] font-semibold text-aubergine">{q.titre}</h3>
            <p className="mt-1 text-[14px] text-mention">{q.intro}</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {q.etudes.map((e) => <CarteEtude key={e.titre} e={e} teinte={q.teinte} />)}
            </ul>
          </div>
        ))}
        <Bientot>Les études se commandent ici dans quelques semaines</Bientot>
      </section>

      <Filet />

      {/* ── Les sagesses du monde ── */}
      <section>
        <div className="grid items-center gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Les anciens savaient lire les signes</p>
            <h2 className="mt-1 font-serif text-[32px] font-semibold leading-tight text-aubergine">Et si on voyageait ensemble ?</h2>
            <p className="mt-2 font-serif text-lg italic leading-relaxed text-mention">
              Choisissez un lieu sur la carte. Vous y trouverez ce que l&apos;on y lisait, par où continuer vos propres recherches — et ce
              que cette sagesse peut lire de vous.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
              Vous connaissez ma passion pour les civilisations anciennes et les croyances mystiques. Alors je vous emmène vers mes
              découvertes — je mets régulièrement mes recherches à jour.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/etudes/archives.webp" alt="" className="aspect-[16/9] w-full rounded-[20px] object-cover shadow-soft md:col-span-2" />
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[28px] border border-gold/30 bg-gradient-to-br from-[#FBF3E2] via-[#F7EBD6] to-[#EFE0C6] p-2 shadow-soft">
          <div className="relative overflow-hidden rounded-[22px]" style={{ aspectRatio: "950 / 450" }}>
            <div className="absolute inset-x-0" style={{ top: "-9%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/carte-monde.svg" alt="" className="w-full opacity-[0.28]" style={{ filter: "sepia(1) saturate(0.6) brightness(0.75)" }} />
              {MONDE.map((m) => {
                const actif = m.cle === pays;
                const droite = m.cle === "perse" || m.cle === "tibet";
                return (
                  <button
                    key={m.cle}
                    type="button"
                    onClick={() => setPays(m.cle)}
                    aria-label={m.nom}
                    aria-pressed={actif}
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <span className="relative flex h-6 w-6 items-center justify-center">
                      {actif && <span className="absolute inline-flex h-full w-full scale-150 rounded-full bg-gold/40" />}
                      <span className={`relative inline-flex rounded-full ring-2 ring-white transition ${m.aVenir ? "h-2.5 w-2.5 bg-gold/50" : "h-3.5 w-3.5"} ${actif ? "bg-aubergine" : m.aVenir ? "" : "bg-gold group-hover:bg-gold-dark"}`} />
                    </span>
                    <span className={`absolute whitespace-nowrap rounded-full px-2 py-0.5 font-serif text-[13px] transition ${droite ? "left-7 top-1/2 -translate-y-1/2" : "left-1/2 top-6 -translate-x-1/2"} ${actif ? "bg-aubergine text-cream" : m.aVenir ? "text-aubergine/60 group-hover:bg-white/80" : "bg-white/80 text-aubergine group-hover:bg-white"}`}>{m.nom}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 grid items-start gap-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-dark">{civ.lieu}</p>
            <h3 className="mt-1 font-serif text-[30px] font-semibold leading-tight text-aubergine">{civ.nom}</h3>
            <p className="text-[12px] text-mention">{civ.epoque}</p>
            <p className="mt-2 text-[15px] leading-relaxed text-ink/85">{civ.texte}</p>
            <ul className="mt-4 divide-y divide-greige border-y border-greige">
              {civ.methodes.map(([a, b]) => (
                <li key={a} className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
                  <span className="font-semibold text-ink">{a}</span>
                  <span className="text-right text-mention">{b}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] italic text-mention">{civ.statut}</p>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-dark">Pour voyager par vous-même</p>
              <ul className="mt-2 space-y-1.5">
                {civ.pistes.map((x) => (
                  <li key={x} className="flex gap-2 text-[13px] leading-snug text-ink/80">
                    <span aria-hidden className="text-gold">✦</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {civ.aVenir ? (
            <p className="rounded-[20px] border border-dashed border-gold/40 px-5 py-6 text-[14px] text-mention md:col-span-3">
              Cette sagesse arrive sur la carte quand son étude existera. En attendant, elle est nommée, pas vendue.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 md:col-span-3">
              {civ.etudes.map((e) => <CarteEtude key={e.titre} e={e} teinte="border-[#D4E0EA] bg-[#EBF2F7]" />)}
            </ul>
          )}
        </div>
      </section>
    </EspaceShell>
  );
}
