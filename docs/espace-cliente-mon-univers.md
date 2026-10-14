# L'espace cliente après le lancement — « Mon univers »

Décisions prises avec Elena les 12–14 octobre 2026, à partir des maquettes
`app/apercu-tmp/{salon-v2,tests,tirages,ciel}` (non commitées). Ce document
est le plan de l'après-lancement ; rien ici n'est construit.

## Le menu, en trois groupes

```
✦ Mon espace            ← l'accueil « Le Salon » (voir maquette-espace-cliente-le-salon.md)
☾ Consultations
◎ Mon crédit
────────────────────────
MON UNIVERS             ← intertitre doré, une respiration
◷ Mon profil            sa journée, ses signes, ses chiffres, ses affinités
▤ Mes tirages           ce qu'Elena tire à la main (Pythie, Grand Tableau)
▥ Mes rapports          les études calculées, et celles déjà achetées
◇ Tests spirituels      les six tests du site, gratuits, résultats gardés
────────────────────────
⚙ Compte & paramètres   email, numéro, mot de passe
```

Téléphone : sous le pouce **Espace · Profil · Tirages · Crédit**, et « Plus »
pour Consultations, Rapports, Tests, Compte (même mécanique que le cabinet).

Sur « Mon espace », une tuile fine « Mon univers » (*votre journée · un
test · votre prochain tirage*) : une porte vers le deuxième groupe.

## Où va l'ancien onglet Profil

| Avant | Maintenant |
|---|---|
| Date de naissance, ascendant | Mon profil — c'est ce qui le calcule |
| Mes proches | Mon profil → Vos affinités (sa mère, sa fille…) |
| « Pour ma prochaine consultation » | Mon espace (tuile) et Consultations |
| Email, numéro, mot de passe | Compte & paramètres |

La règle d'août (« le profil, c'est ce qu'Elena regarde ; le compte, c'est
ce que le système utilise ») survit : « Mon univers » d'un côté, le compte
seul en bas.

## Mon profil — « Votre ciel, vos chiffres, vos affinités »

Signature partout : *calculé d'après la méthode Wolska*. Six teintes pastel
en rotation (rose, doré, lavande, sauge, ciel, mauve), glyphes en texte
(♏︎, jamais emoji), caractère chinois (羊), nombres en Cormorant, trois
petites étoiles par carte, la lune du jour tracée.

1. **Votre journée** (en tête, dégradé pastel) : date, signe, lune ; un
   texte court dans la voix d'Elena ; quatre pastilles (amour, travail,
   énergie, chance) ; liens semaine · mois · année · carte du jour.
   Contenu à produire : commencer par **la semaine** (12 textes le
   dimanche, générés dans sa voix, relus par elle en vingt minutes).
2. **Votre profil** : signe, ascendant, signe chinois, chemin de vie, dette
   karmique, année personnelle — six cartes, deux lignes chacune.
3. **Vos affinités** : elle et une autre personne (contrat d'âme, signes,
   signes chinois, vibration) ; « Vous et… » = un prénom + une date ; le
   résultat d'une page est offert, l'étude complète est un rapport.
4. **Votre prénom en amour** : nombre d'expression, élan de l'âme.

Toutes les données existent sur elena-wolska.com (zodiac, chineseZodiac,
contracts, debtDescriptions, vibrations, coupleMessages) : c'est du portage.

## Mes tirages — « Elena tire pour vous »

Deux tirages seulement (le Rider-Waite est retiré : il n'appartient pas à
Elena). Mise en page « vitrine » : les cartes font le décor (éventail de
trois cartes de la Pythie ; coin de Grand Tableau), filets dorés ✦, un seul
bouton orange.

- **La Petite Pythie** — « Une question » : 3 cartes, photo + lecture d'une
  à deux pages, sous 3 jours. **39 €.**
- **Le Grand Tableau Lenormand** — « Toute votre vie, en un regard » :
  photo + étude de 30 à 40 pages avec sommaire **+ l'audio d'Elena**, sous
  7 jours. **149 € tout compris.** Lien « voir deux pages d'exemple » (la
  page « Votre tirage en une page » + la page du test à carte secrète,
  anonymisées).
- Option **« on en parle »** : 20 min au téléphone après lecture, +39 €.
- Règles : *tirage le mardi* · *1 Grand Tableau par semaine* · les
  commandes reçues **après jeudi minuit partent sur la semaine suivante**
  (gestion d'Elena, pas affiché) · la place se réserve au paiement
  (Stripe, euros — jamais le crédit de minutes) · annulation remboursée
  tant que les cartes ne sont pas tirées.
- Phrase affichée : **« Un seul tirage du Grand Tableau est effectué par
  semaine. Prochaine livraison : semaine du … »** — jamais de compte de
  places, jamais de « complet » faux (voir mémoire rareté-vraie).
- Commande : question facultative (400 car., prénoms de ceux qui comptent),
  case « on en parle », case **SMS cochée par la cliente**, récapitulatif.
- « Mes tirages » : une étagère avec vignette, statut (En préparation ·
  « 2ᵉ de la file · Elena le tire mardi 21 » · Prêt à lire).
- Cabinet : onglet Tirages, file « À faire », dépôt photo + PDF (+ audio).

## Mes rapports — « calculés d'après la méthode Wolska »

Une page offerte, l'étude complète en douze. Cartes fines, pastel, numéro
romain.

| | Prix |
|---|---|
| Votre contrat d'âme à deux | 19 € |
| Votre contrat d'âme (solo) | 19 € |
| Votre année amoureuse (se renouvelle à chaque anniversaire) | 19 € |
| Votre schéma amoureux (le test, déplié) | 14 € |
| Votre prénom en amour (six pages, joli à offrir) | 9 € |
| Le bilan de l'âme (les trois premiers) | 49 € |
| Option « lue par Elena » (+ trois cartes de la Pythie) | +40 € |

Plus tard : le contrat entre elle et son enfant / sa mère.

## Tests spirituels

Les six tests du site, gratuits, dans le Salon : une question par écran,
barre dorée ; le résultat est **gardé et daté** ; case **« Partager ce
résultat avec Elena »** (visible dans la fiche, à côté de « ce que je veux
aborder ») ; tuile « Aller plus loin » vers le rapport correspondant.
Table `tests_resultats` (migration 014).

## Les boosts audio — la voix, que personne ne peut copier

1. « Deux minutes avec Elena » par signe et par semaine, inclus pour les
   clientes actives.
2. Boosts par besoin (*avant de lui écrire*, *après une rupture*, *le soir
   où ça tourne*, *pleine lune*…) : bibliothèque de 8–10 audios de 3 min,
   3–5 € l'un, ou un abonnement doux « Le cercle » (9 €/mois : boosts,
   semaine, carte du jour).
3. La carte du jour, dite. 4. Le mot d'Elena en audio. 5. Un rituel de
   nouvelle lune par mois. 6. Son anniversaire : l'espace change ce
   jour-là. 7. Un bouton « Pas aujourd'hui » qui replie « Votre journée ».

## Ordre de construction (après les verrous et le lancement)

1. Maquette v2 de l'accueil (bouton « Recharger pour appeler », prix,
   prochain rendez-vous, crédit compact) — 3 h, pas de SQL.
2. Menu en trois groupes + Compte & paramètres + redistribution du Profil.
3. Tests spirituels (migration 014) — 1 jour.
4. Mon profil (portage des calculs + affinités) — 2 jours.
5. Mes tirages (migration 015, Storage, Stripe produit, file) — 2 jours.
6. Mes rapports (génération PDF) — 2 jours.
7. Votre journée / semaine, puis les boosts audio.

Principe qui tranche tout : *ce n'est pas une plateforme de voyance, c'est
le cabinet d'Elena, qui a appris à vivre entre deux consultations.*
