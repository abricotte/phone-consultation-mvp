# Les ressources gratuites d'Elena — inventaire (14 octobre 2026)

Elena a demandé de retrouver sur son ordinateur « les ressources gratuites
de mon ancien site WordPress ». Elles ne sont plus dans WordPress : elles
ont été **portées dans le site actuel** (Next.js), dossier
`C:\Users\evaow\Downloads\ELENA-WOLSKA - HOSTINGER-WORDPRESS\elena-wolska-love-calculator`
(lecture seule — c'est la source de elena-wolska.com en production).
L'archive Duplicator `sitedupliqueelena_…_archive.zip` (24 juillet 2025,
473 Mo) est la copie Hostinger/Elementor : dix pages, aucun article. Rien
à en tirer.

## 1. Sur le site, `src/app/ressources-gratuites/` — 27 pages

### Sept tests (composant `QuizCategoryLayout`, profils de résultat)
| Test | Résultats |
|---|---|
| Êtes-vous dans un amour placebo ? | 12 |
| Quel amour vous attend ? | 13 |
| Quel est mon don spirituel ? | 15 |
| Quel est mon contrat d'âme ? | 19 |
| Suis-je dans une relation karmique ? | 30 |
| Quel est votre schéma répétitif en amour ? | 18 |
| Est-ce votre flamme jumelle ? (+ formulaire « prévenue ») | 15 |

→ **Tests spirituels** de l'espace (six prévus : ils sont tous là, plus un).
Les résultats existent déjà, écrits dans sa voix.

### Deux tirages gratuits en ligne
- **Tirage Lenormand** (`LenormandTirage`) et **Tirage Tarot amour**
  (`TarotTirage`, 23 arcanes dans `src/data/tarot.ts`).
→ Dans l'espace : *Tests spirituels* ou *Apprendre* — jamais dans *Mes
tirages*, qui reste « Elena tire pour vous », à la main.

### Dix-sept articles (`ArticleLayout`, trois rubriques)
**Amour & Relations** — Pourquoi attendre un message nous met dans un tel
état (510 mots) · Comment rencontrer l'amour en 2026 (1 070) · Comprendre
un lien karmique (536) · Contrat d'âme, le grand article interactif
(1 320, accordéons, comparateur, étapes) · Pourquoi le dating est si
difficile (669) · Ghosting amoureux (530) · Intuition ou peur en amour
(848) · Les 12 contrats d'âme (249) · Les liens d'âme (576) · Pourquoi on
tombe toujours amoureux des mêmes personnes (946) · Signes qu'il / elle
pense à vous (594) · Relativisons la solitude (753).
**Guérison & Bien-être** — Calendrier lunaire (598) · Carte des chakras
(234) · Guide des cristaux (840).
**Intuition & Signes** — Heures miroirs (555) · Synchronicités (558).

→ **Le salon · Lire et grandir** : ce sont ses textes, prêts. Et des
« boosts » tout trouvés : *Attendre un message*, *La solitude*,
*Intuition ou peur* sont déjà écrits — il reste à les dire.

### Les données du moteur (`src/data`, `src/lib`)
`engine.ts` (contrats, chemin de vie, dettes, année personnelle, score),
`contracts.ts` (12 contrats), `vibrations.ts`, `debtDescriptions.ts`,
`coupleMessages.ts`, `zodiac.ts`, `chineseZodiac.ts`, `chakras.ts`,
`tarot.ts`, `astrology.ts`, `esoteric.ts` — et `_source/` : architecture
du système, `vibrations-ame-elena-wolska.md` (12 textes longs),
`12-contrats-descriptions-longues-pack1.md`.
→ **Mon profil** et la **machine à rapports** (déjà prévu).

## 2. Hors site — ce qu'elle a déjà écrit

| Document | Où | Ce que c'est | Pour l'espace |
|---|---|---|---|
| **Les 12 jours sacrés — le miroir de ton année** (30 pages, 2026) | `…HOSTINGER-WORDPRESS\elenawolska_12_premiers_jours_de_lannee.pdf` | journal : les 12 premiers jours de janvier → les 12 mois ; une double page par jour, carte de l'année, notes | **Mon chemin**, rituel de janvier, offert aux clientes — à refaire chaque année. *Vérifier la phrase d'origine (« racines dans la Kabbale ») : la tradition des douze jours est surtout un folklore européen de Noël ; dire « une vieille tradition d'Europe » suffit et ne ment pas.* |
| **Les Carnets roses d'Elena — L'Amour karmique et les liens d'âme, 15 quiz** (250 pages, format KDP 6×9) | `14_ELENA WOLSKA\12_VOYANCE_SPIRITUALITE\LE BONQUIZZ CARNET ELENA…pdf` | le livre Amazon (*Les Carnets d'Elena Wolska*) : 15 quiz — quel lien vous unit, pourquoi lui pourquoi maintenant, ressent-il la même chose, vie antérieure, nœud karmique, amour ou dépendance, pourquoi il s'éloigne, toxique/karmique/passion, ta valeur, ce que tu refuses de voir, ce que ce lien te fait travailler, s'il revenait, as-tu fermé le cycle, vers quelle union ton âme aspire | **Le salon · Lire et grandir** (déjà en lien) ; et quinze tests de plus pour *Tests spirituels*, si elle veut en offrir certains |
| **Contrats d'âmes** (194 pages, ~25 000 mots) | `elena-wolska-love-calculator\book_content.txt`, `Contrats_Ames_KDP_v3.docx`, `14_ELENA WOLSKA\Contrats d'ames KDP\` | le second livre KDP, intro « Pourquoi vous attirez certaines personnes » → « Honorer le chemin » ; + `QUIZ KDP ELENA KARMA.docx` | la matière de *Votre contrat d'âme* (solo et à deux) — les textes de sa voix sont déjà écrits |
| **PDF oracle ELENA** (45 pages) + copie (10 p.) | `14_ELENA WOLSKA\12_VOYANCE_SPIRITUALITE\` | le livret de la **Petite Pythie** : Grand Amour, Âme sœur, Passion dévorante, Flamme jumelle, Mission commune, Contrat, Destin, Rêves, Liberté… | la lecture écrite de chaque carte → *Mes tirages* (la Pythie) et, un jour, le livre de l'oracle |
| **Tirage astrologique de Mme Lenormand** (13 pages) | idem | votre futur en 12 cartes, les 12 maisons, tirage et interprétation signés | un **troisième tirage à la main** possible dans *Mes tirages* (entre la Pythie à 55 € et le Grand Tableau à 149 €) — et le podcast est cité dedans |
| **Grand Tableau Lenormand** — exemples (Olga, Basile, Armanda, Frédéric audio) | idem + `Podcast La Minute Voyance\` | les études livrées, 30–40 pages, avec audio | le modèle du PDF (déjà repris par le skill lenormand) |
| **Égypte mystique** (programme 7 pages, avec ML) | `…HOSTINGER-WORDPRESS\Egypte mystique - ML et Elena Wolska.pdf` | voyance et transformation spirituelle en Égypte, Gizeh → … | **Voyages spirituels** : un second voyage après Delphes/Délos |
| **La Minute Voyance** (podcast, audios) | `14_ELENA WOLSKA\Podcast La Minute Voyance\` | intro, épisodes, la voix d'Elena (dont essais ElevenLabs) | *Apprendre* (déjà en lien Spotify) ; **ne pas** utiliser la voix synthétique pour les boosts : « la voix que personne ne peut copier » |
| **Illustrations** (36 visuels nommés) | `…HOSTINGER-WORDPRESS\illustrations\` | âme sœur, âme miroir, flamme jumelle, ghosting, leçon karmique, don spirituel, tests, avant/pendant/après consultation, voyage Islande… | les visuels des tests et des articles dans l'espace |

## 3. Ce que ça change au plan

1. **Tests spirituels** : rien à écrire — sept tests complets à porter
   (migration 014 prévue), plus quinze dans les Carnets si elle veut.
2. **Le salon** : dix-sept articles prêts pour *Lire et grandir* ; trois
   boosts déjà écrits, à enregistrer.
3. **Mon chemin** : *Les 12 jours sacrés* devient le rituel de janvier,
   offert ; son almanach de l'année en est le prolongement payant.
4. **Mes tirages** : le tirage astrologique Lenormand, 12 cartes, est un
   troisième produit possible (prix à fixer, entre 55 et 149).
5. **Méthode Wolska** : les textes des contrats et des vibrations existent
   déjà (livre + `_source`). Le pipeline n'a plus qu'à les assembler.

## 4. Un livre par connaissance ?

Oui — et c'est **le même pipeline** que les études : les textes de sa voix,
écrits une fois, servent trois fois (la page offerte, l'étude relue, le
livre). Elle a déjà deux livres (*Les Carnets roses*, *Contrats d'âmes*)
et deux livrets prêts à devenir des livres (*la Petite Pythie*, *les 12
jours sacrés*). L'ordre qui tient :

1. **La Petite Pythie — le livre de l'oracle** (le livret de 45 pages
   existe, les 36 cartes sont peintes) : compagnon naturel du jeu.
2. **Le Grand Tableau Lenormand — le manuel** (le podcast, trois études
   livrées, le tirage astrologique : la matière est là).
3. **Les 12 jours sacrés** en édition annuelle (déjà maquetté).
4. **Les prénoms en amour** quand la base des 300 prénoms existe.
5. Les sagesses du monde, **une par une, après l'étude** — jamais avant :
   le livre sur les runes vient quand le tirage de runes a tourné un an.
   Et pas de livre sur ce qu'on ne sait pas faire (nakshatra, quatre
   piliers) sans quelqu'un qui connaît la tradition.

Collection : *Les Carnets d'Elena Wolska*, qui existe déjà sur Amazon.
Chaque livre = un gabarit de plus dans la machine, pas un chantier.
