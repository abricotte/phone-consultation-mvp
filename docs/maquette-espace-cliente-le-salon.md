# Espace cliente — maquette « Le Salon »

Cahier d'intégration, validé par Elena le 10 octobre 2026. À implémenter
dans le frontend Next.js de la plateforme (`frontend/`), à la place de
l'espace cliente actuel. Rédigé pour une session de travail qui n'a pas
suivi la conception : tout ce qu'il faut savoir est ici.

Maquette de référence (canevas, 5 propositions — c'est la **proposition 1**
qui est retenue) : https://claude.ai/artifact/1F5XshQdVe4y6wQTW79Evg
Écrans : `Main.dc.html` (bureau, 1280 px) et `P1-Mobile.dc.html`
(téléphone, 390 px).

---

## 1. L'intention en trois phrases

Un tableau de bord doux. Menu fixe à gauche sur ordinateur, barre
d'onglets en bas sur téléphone, comme une application. Tout l'essentiel
tient sans défiler, en tuiles, et chaque tuile répond à une question que
la cliente se pose en arrivant :

| Tuile | La question |
|---|---|
| Carte d'Elena | « Puis-je l'appeler maintenant ? » |
| Mon crédit | « Combien me reste-t-il ? » |
| Prochaines permanences | « Quand revient-elle ? » |
| Ce que je veux aborder | « Qu'est-ce que je veux lui dire ? » |

C'est la version la plus « produit », la plus rassurante pour une cliente
qui revient souvent.

---

## 2. Ce qui ne change pas (règles d'Elena, déjà en vigueur)

Ces décisions sont antérieures à la maquette et la maquette les respecte.
Ne pas les rouvrir.

- **« L'accueil décide, Mon crédit exécute. »** Aucune recharge sur
  l'accueil : la tuile crédit mène à `/credit`, elle ne recharge pas.
- **Deux portes** : « Appeler maintenant » et « Réserver un créneau ».
  Le bouton d'appel garde le même libellé mais mène soit à l'appel, soit
  à `/credit?pour=appeler` si le crédit manque ; la cliente ne choisit
  jamais entre appeler et recharger, le système sait.
- **Pas de compteur qui juge** : ni « votre dernière consultation il y a
  12 jours », ni urgence fabriquée, ni compte à rebours.
- **Le chemin (historique) vit dans l'onglet Consultations**, pas sur
  l'accueil.
- **Profil ≠ Compte** : « le profil, c'est ce qu'Elena regarde ; le
  compte, c'est ce que le système utilise ». Les deux onglets restent.
- **Le mot d'Elena** remplace la pensée du jour quand il existe ; il n'y a
  jamais d'état vide.
- **Espace étanche** : un compte `consultant`/`admin` qui arrive dans
  l'espace cliente est redirigé vers `/cabinet-ew` (garde existante dans
  `EspaceNav`, à conserver dans le nouveau shell).
- Tarifs, durées, paliers : lus depuis `api.getRechargeConfig()`, jamais
  codés en dur. Toute l'interface en français.

---

## 3. Structure : un « shell » commun aux cinq onglets

Aujourd'hui chaque page de l'espace insère `<EspaceNav />` (barre de
pilules) sous le `SiteHeader` global. La maquette remplace cela par un
**shell** qui enveloppe les cinq pages :

```
/dashboard       Mon espace     (accueil, détaillé en §4)
/consultations   Consultations
/credit          Mon crédit
/profil          Profil
/compte          Compte
```

### 3.1 Bureau (≥ 768 px)

```
┌──────────────┬────────────────────────────────────────────┐
│  logo        │  contenu de la page                        │
│              │  (padding 40px 48px, max-width ~1040px)    │
│  ✦ Mon espace│                                            │
│  ☾ Consult.  │                                            │
│  ◎ Mon crédit│                                            │
│  ◯ Profil    │                                            │
│  ⚙ Compte    │                                            │
│              │                                            │
│  [Claire]    │                                            │
│  Déconnexion │                                            │
└──────────────┴────────────────────────────────────────────┘
```

- **Barre latérale** : largeur 232–248 px, fond blanc (`bg-ivory`),
  bordure droite `border-greige`, padding 28px 18px. Elle est
  `sticky top-0 h-screen` sur bureau.
- **Logo** en haut (même image que le site : `/images/elena-wolska-logo.png`,
  hauteur 52 px), lien vers `/`.
- **Navigation verticale** : 5 liens, hauteur 44 px minimum, padding
  12px 14px, `rounded-2xl`, icône 18 px à gauche + libellé 15 px.
  - Actif : fond `bg-aubergine`, texte `text-cream`, poids 600, icône
    `gold-light`. Attribut `aria-current="page"`.
  - Inactif : texte `text-mention`, poids 500, icône `text-gold`,
    hover `bg-blush text-aubergine`.
- **Bas de barre** (`mt-auto`) : pastille utilisatrice dans un bloc
  `bg-blush rounded-2xl p-3.5` — initiale dans un rond `bg-aubergine`
  34 px, prénom en 14 px 600, signe · ascendant en 12 px `text-mention`
  (seulement si renseignés). Sous la pastille, « Déconnexion » en 12 px
  `text-mention`.
- **Contenu** : `flex-1 min-w-0`, padding `40px 48px 48px`.

### 3.2 Téléphone (< 768 px)

```
┌────────────────────────────┐
│ logo (40px)         [C]    │  ← en-tête réduit
├────────────────────────────┤
│  contenu (padding 20px)    │
│  défile                    │
├────────────────────────────┤
│ ✦     ☾     ◎     ◯    ⚙  │  ← barre d'onglets fixe
│Espace Consult Crédit Profil Compte
└────────────────────────────┘
```

- **En-tête réduit** : logo 40 px à gauche, initiale de la cliente dans un
  rond `bg-aubergine` 36 px à droite (lien vers `/compte`).
- **Barre d'onglets** : `fixed bottom-0`, fond blanc, bordure haute
  `border-greige`, padding `10px 8px calc(22px + env(safe-area-inset-bottom))`.
  5 onglets répartis (`justify-around`), chacun : icône 22 px au-dessus
  d'un libellé 10 px, largeur min 60 px, zone tactile ≥ 44 px.
  - Actif : icône et libellé `text-aubergine`, poids 600 (l'icône étoile
    est pleine).
  - Inactif : `text-mention`, poids 500.
  - Libellés courts : **Espace · Consultations · Crédit · Profil · Compte**.
- Le contenu reçoit un `pb-28` pour ne pas passer sous la barre.
- La « Déconnexion » mobile vit dans l'onglet Compte (pas dans la barre).

### 3.3 Le SiteHeader et le footer globaux

Dans l'espace, la barre latérale porte le logo : le `SiteHeader` global
ferait doublon. Décision :

- `SiteHeader` et le footer **ne s'affichent pas** sur les routes de
  l'espace (`/dashboard`, `/consultations`, `/credit`, `/profil`,
  `/compte`). Le plus simple : un composant client `SiteChrome` qui lit
  `usePathname()` et rend `null` sur ces routes, ou un groupe de routes
  `app/(espace)/` avec son propre `layout.tsx` qui monte le shell — au
  choix de l'implémentation, l'effet visible est le même.
- Les pages publiques (`/`, `/login`, `/register`,
  `/consultation-minute`) gardent header et footer tels quels.

### 3.4 Icônes

Pas d'emoji. SVG inline, trait 1,8 px, `stroke-linecap: round`, 24×24 :

| Onglet | Icône |
|---|---|
| Mon espace | étoile à quatre branches, **pleine** : `M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z` |
| Consultations | croissant de lune : `M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z` |
| Mon crédit | cercle `r=9` + signe € stylisé : `M14.5 9.5a3 3 0 0 0-5 2.5 3 3 0 0 0 5 2.5M8 11h5M8 13h5` |
| Profil | `circle cx=12 cy=8 r=4` + `M4 21a8 8 0 0 1 16 0` |
| Compte | `circle cx=12 cy=12 r=3` + 8 rayons `M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1` |
| Appeler | combiné : `M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z` |
| Réserver | `rect x=3 y=5 w=18 h=16 rx=2` + `M3 10h18M8 3v4M16 3v4` |
| Modifier | crayon : `M4 20h4l10-10-4-4L4 16v4zM13 7l4 4` |
| Flèche | `M5 12h14M13 6l6 6-6 6` |

Le glyphe `✦` (texte, pas emoji) reste autorisé comme ornement décoratif
(`aria-hidden`), comme aujourd'hui.

---

## 4. L'accueil `/dashboard`, tuile par tuile

### 4.1 En-tête

```
MARDI 7 OCTOBRE                      ← 11px, 600, uppercase, tracking 0.14em, text-mention
Bonjour Claire                       ← Cormorant 46px (36px mobile), 600, text-aubergine
« Rien ne meurt, tout se transforme. » ← Cormorant italique 19px, text-mention
```

- Le signe astrologique n'est plus dans l'en-tête : il a migré dans la
  pastille utilisatrice de la barre latérale (§3.1). Sur mobile il
  n'apparaît pas sur l'accueil (il reste dans Profil).
- **Le mot d'Elena**, s'il existe (`api.getMotElena()`), remplace la
  citation : on garde exactement l'encadré actuel (bordure `gold/40`,
  dégradé `gold/10 → cream`, étiquette « LE MOT D'ELENA », texte en
  Cormorant italique 18 px, date en 11,5 px `gold-dark/70`). Largeur max
  `max-w-xl`.
- Les bandeaux de retour Stripe (`?payment=success|cancel`) et d'erreur
  restent au-dessus de la grille, inchangés.

### 4.2 La grille

Bureau : `grid grid-cols-3 gap-5`. Téléphone : une colonne, dans l'ordre
**Carte d'Elena → Mon crédit → Permanences → Ce que je veux aborder**.

```
┌──────────────────────────────┬──────────────┐
│  A · Carte d'Elena   (2 col) │ B · Crédit   │
├──────────────────────────────┼──────────────┤
│  C · Permanences     (2 col) │ D · Aborder  │
└──────────────────────────────┴──────────────┘
```

Toutes les tuiles : `rounded-3xl` (24 px), padding 28 px (20 px mobile).
Tuiles claires : `bg-ivory border border-greige`. La tuile A porte en plus
`shadow-soft`.

### 4.3 Tuile A — Carte d'Elena (2 colonnes)

C'est `HeroConsultation` réorganisé, **sans changer sa logique**. Toute la
machine à états (`useElenaPresence`, `heureRetour`, `permanenceAujourdhui`,
`creditSuffisant`, `handleAppel`) est reprise telle quelle. Ce qui change
est la mise en page :

1. **Ligne de statut** (plus de bannière pleine largeur colorée) :
   - Avatar d'Elena 64 px (`/images/elena-avatar.png`), anneau blanc 3 px,
     badge de statut 18 px en bas à droite (`ring-2 ring-white`), pouls
     (`animate-ping`) uniquement quand elle est disponible ou quand une
     permanence est en cours.
   - À droite, deux lignes : le **titre** en 24 px 700 et le **sous-titre**
     en 14 px `text-mention`.
   - Couleurs du titre et du badge selon l'état :

   | État | Badge | Titre | Sous-titre |
   |---|---|---|---|
   | `disponible` | `bg-statut-online` + pouls | `text-statut-online` « Elena est en ligne » | « vous pouvez l'appeler maintenant » |
   | `en_consultation` | `bg-amber-500` | `text-amber-700` « Elena est en consultation » | « de retour vers 15 h 03 » si `retourPrevu` |
   | hors ligne, absence | `bg-statut-offline` | `text-mention` « Elena n'est pas en ligne » | `messageAbsence` en italique |
   | hors ligne, permanence en cours | `bg-gold` + pouls | `text-gold-dark` « Permanence en cours — Elena arrive » | « Prévue de 17h45 à 19h · restez à proximité » |
   | hors ligne, permanence aujourd'hui | `bg-gold` | `text-aubergine` « Elena sera en ligne aujourd'hui, de 17h45 à 19h » | « le bouton d'appel apparaîtra à cette heure » |
   | hors ligne, prochaine permanence | `bg-statut-offline` | `text-aubergine` « Prochaine permanence : jeudi 17h45 » | « à la minute pendant la permanence — ou réservez un créneau » |
   | hors ligne, semaine sans permanence | `bg-statut-offline` | `text-mention` « Pas de permanence cette semaine » | « les consultations se font sur rendez-vous » |
   | hors ligne, pas de permanences du tout | `bg-statut-offline` | `text-mention` « Elena n'est pas en ligne » | `heuresIndicatives` |
   | `chargement` | `bg-greige` | « Vérification… » | — |

2. **Porte 1 — le bouton d'appel** (pleine largeur, `rounded-2xl`,
   padding 18px 24px, deux lignes centrées : libellé 19 px 600 + mention
   12 px) :

   | Condition | Rendu | Destination |
   |---|---|---|
   | en ligne **et** crédit suffisant | plein `bg-cta text-cta-text shadow-card`, icône combiné + « Appeler maintenant » / « à la minute · 2,90 €/min · votre téléphone sonne » | `handleAppel()` |
   | en ligne, crédit insuffisant | plein `bg-cta`, « Appeler maintenant » / « il vous reste 4 min — rechargez pour appeler » | `/credit?pour=appeler` |
   | permanence aujourd'hui, crédit insuffisant | plein `bg-cta`, « Préparer mon crédit pour l'appeler » / « rechargez maintenant — vous serez prête à 17h45 » | `/credit?pour=appeler` |
   | permanence aujourd'hui, crédit suffisant | **constat**, pas un bouton : bordure `gold/40`, fond `gold/5`, « Vous êtes prête pour 17h45 » en `text-gold-dark` / « revenez à cette heure — le bouton d'appel apparaîtra » | — |
   | sinon | constat : bordure `greige/70`, fond `cream/50`, « Appeler dès qu'Elena se libère » ou « Appeler pendant la permanence » en `aubergine/70` / heure de retour ou prochaine permanence | — |

   Le prix par minute vient de `prixMinuteCents` (config), formaté « 2,90 € ».

3. **Porte 2 — « Réserver un créneau »** (pleine largeur, `rounded-2xl`,
   padding 16px 24px, icône calendrier + libellé 17 px 600, mention
   « Découverte 20 min · Complète 45 min » en 12 px). Lien vers
   `https://elena-wolska.com/disponibilites`.
   - Contour (`border-greige bg-white text-aubergine`) quand la porte 1
     est un vrai bouton plein ; **plein `bg-cta`** quand la porte 1 est un
     constat — règle identique à aujourd'hui.

4. Les messages de retour de `handleAppel` (`message` vert, `erreur` rouge)
   s'affichent sous les deux portes, comme aujourd'hui.

5. **Supprimé de la carte** : la ligne « Votre crédit : 20 min · n'expire
   jamais » et le lien « Recharger mon crédit » (la tuile B les porte
   désormais). La mention « il faut au moins 5 min (14,50 €) pour
   appeler », quand elle s'applique, passe dans le sous-titre du bouton.

### 4.4 Tuile B — Mon crédit (1 colonne, fond nuit)

La seule tuile sombre : c'est elle qui donne le relief à la grille.

```
bg-aubergine text-cream rounded-3xl p-7, relative overflow-hidden
  ✦  (coin haut droit, gold/60, 20px, aria-hidden)
  MON CRÉDIT            11px 600 uppercase tracking 0.14em, text-gold-light
  20 min                Cormorant 64px 600 (« min » en 26px 500)
  ≈ 58 € · n'expire jamais   13px, cream/70
  [ Recharger → ]       mt-auto, pleine largeur, rounded-2xl, py-3
                        fond cream/10, bordure gold-light/50, 14px 600
```

- `20` = `Math.floor(balance * 100 / prixMinuteCents)` (calcul actuel).
- `≈ 58 €` = le solde en euros (`balance`), formaté « 58 € » ou « 14,50 € ».
- « Recharger » est un **lien vers `/credit`**, rien de plus.
- Mobile : la tuile devient une rangée (`flex justify-between`) — solde à
  gauche (Cormorant 40 px), bouton « Recharger » à droite.

### 4.5 Tuile C — Prochaines permanences d'Elena (2 colonnes)

Reprend `EncadrePermanences` (mêmes données, mêmes règles d'affichage) :

- **Masquée** si Elena est `disponible`, pendant le `chargement`, ou si
  `permanence.actives` est faux. Dans ce cas la tuile D passe en pleine
  largeur sous la tuile A, ou la grille se recompose (`A + B` sur une
  ligne, `D` seule) — ne pas laisser de trou.
- **Semaine sans permanence** : la tuile prend la variante actuelle
  (bordure `gold/40`, dégradé `gold/10 → ivory`, « Cette semaine, Elena
  reçoit uniquement sur rendez-vous », bouton `bg-aubergine` « Voir les
  créneaux disponibles »).
- **Permanences posées** : titre Cormorant 24 px « Prochaines permanences
  d'Elena » + mention 12 px « joignable à la minute pendant ces
  créneaux ». Puis une liste (max 3, celles d'aujourd'hui exclues puisque
  déjà dans la tuile A), chaque ligne `bg-blush rounded-2xl px-3.5 py-3` :

  ```
  [ Jeu.  ]  17h45 – 19h00                      dans 2 jours
  [ 9 oct.]                                     (12px 600 gold-dark, 1re ligne seulement)
  ```
  Bloc date à gauche (56 px, Cormorant 22 px 700 pour le jour abrégé,
  13 px `text-mention` pour la date), heures en 15 px 600 `text-aubergine`.
  Utiliser `libelleCourtPermanence` / `dansCombien` de `useElenaStatus`.
- Pied : filet pointillé + « Aucun de ces moments ne vous convient ?
  **Réservez votre créneau au calendrier →** » (lien `text-prix`).
- Mobile : lignes simplifiées `flex justify-between` (« Jeudi 9 oct. » /
  « 17h45 – 19h00 »).

### 4.6 Tuile D — Ce que je veux aborder (1 colonne)

Nouvelle sur l'accueil ; la donnée existe déjà (`profil.aAborder`, lue par
`api.getProfil()`, écrite par `api.updateProfil({ aAborder })`).

```
Ce que je veux aborder          Cormorant 24px 600
┌──────────────────────────────┐
│ Mon déménagement en novembre │   14px, leading 1.55, bg-cream,
│ et savoir si je dois…        │   border-greige, rounded-2xl, p-3.5
└──────────────────────────────┘
Elena le lit avant de vous appeler. Personne d'autre.   12px text-mention
✎ Modifier                      mt-auto, 14px 600 text-prix
```

- **Lecture seule sur l'accueil** : « Modifier » mène à `/profil#aborder`
  (ancrer la section dans Profil). On ne duplique pas le formulaire.
- Texte vide : l'encadré affiche en italique `text-mention` « Rien pour
  l'instant — notez ici ce que vous voulez lui dire. » et le lien devient
  « Écrire ».
- Tronquer visuellement à 4 lignes (`line-clamp-4`).

---

## 5. Les quatre autres onglets

Ils ne changent **pas de contenu** ; ils entrent dans le shell :

- Retirer `<EspaceNav />` de `consultations`, `credit`, `profil`,
  `compte` et `dashboard`.
- Garder `font-jakarta` sur le conteneur de chaque page, les `max-w`
  actuels (`max-w-3xl` / `max-w-4xl`) et les titres Cormorant.
- Les titres de page (« Mon chemin avec Elena », « Mon crédit », …) se
  placent en haut du contenu avec la même marge que « Bonjour Claire »
  (plus de `mt-8` compensant l'ancienne barre de pilules).
- Dans Profil, donner un `id="aborder"` à la section « Ce que je veux
  aborder » (cible du lien de la tuile D).

---

## 6. Jetons de design (déjà dans `tailwind.config.ts`)

Rien à ajouter au thème ; tout existe. Pour mémoire :

| Usage | Classe / valeur |
|---|---|
| Fond de page | `bg-cream` #FDF9F3 |
| Tuiles claires | `bg-ivory` #FFFFFF + `border-greige` #EAD9CC |
| Tuile crédit, nav active | `bg-aubergine` #232B45 |
| Fond doux (lignes de permanence, pastille) | `bg-blush` #FAF0EA |
| Texte courant / titres | `text-ink` #4A3B33 / `text-aubergine` |
| Microcopie | `text-mention` #7c695e |
| CTA plein | `bg-cta` #C24818, texte `text-cta-text`, hover `bg-cta-dark` |
| Liens d'action, prix | `text-prix` #B0430F |
| Or | `text-gold` #c9a96e, `gold-light` #d8c199, `gold-dark` #8a6f3e |
| En ligne | `statut-online` #3B6D11 |
| Hors ligne | `statut-offline` #B4B2A9 |
| Ombres | `shadow-soft` (tuiles), `shadow-card` (CTA) |
| Titres | `font-serif` (Cormorant) |
| Corps de l'espace | `font-jakarta` (Plus Jakarta Sans) |
| Rayons | tuiles `rounded-3xl`, boutons `rounded-2xl`, pilules `rounded-full` |

Chiffres toujours en `tabular-nums lining-nums` (réglé globalement).

---

## 7. Composants : quoi créer, quoi modifier

| Fichier | Action |
|---|---|
| `components/EspaceShell.tsx` | **Créer.** Barre latérale (bureau) + en-tête réduit et barre d'onglets (mobile) + zone de contenu. Reprend de `EspaceNav` la liste des onglets, la garde de rôle (`consultant`/`admin` → `/cabinet-ew`) et `handleLogout`. Reçoit `prenom`, `signe`, `ascendant` en props optionnelles pour la pastille. |
| `components/EspaceNav.tsx` | **Supprimer** une fois les cinq pages passées au shell. |
| `components/SiteHeader.tsx` | Rendre `null` sur les routes de l'espace (ou groupe de routes, §3.3). Même traitement pour le footer de `app/layout.tsx` (l'extraire en `SiteFooter`). |
| `components/HeroConsultation.tsx` | **Refondre en `CarteElena.tsx`** : même logique, mise en page §4.3. Supprimer la ligne de crédit et le lien recharge. |
| `components/TuileCredit.tsx` | **Créer** (§4.4). Props : `soldeEuros`, `soldeMinutes`. |
| `components/EncadrePermanences.tsx` | **Renommer `TuilePermanences.tsx`**, adapter la liste (§4.5). Garder `statutDemo` / `prochainesDemo` pour les aperçus. |
| `components/TuileAborder.tsx` | **Créer** (§4.6). Prop : `texte: string`. |
| `app/dashboard/page.tsx` | Monter le shell, l'en-tête §4.1 et la grille §4.2. Ajouter `aAborder` à ce que l'on lit de `getProfil()`. |
| `app/consultations`, `credit`, `profil`, `compte` | Retirer `EspaceNav`, envelopper dans le shell (§5). |
| `app/apercu-tmp/*` | Pages d'aperçu non commitées : à mettre à jour ou supprimer, au choix. |

Ordre conseillé : shell → accueil (carte, crédit, permanences, aborder) →
les quatre autres onglets → suppression de `EspaceNav` → aperçu mobile
réel sur téléphone.

---

## 8. Accessibilité et détails qui comptent

- Contrastes : tous les couples ci-dessus sont ≥ 4,5:1 (vérifiés lors de
  la palette du 7 juillet 2026). Ne pas éclaircir `text-mention`.
- Zones tactiles ≥ 44 px (onglets mobiles, boutons, lien « Recharger »).
- `aria-current="page"` sur l'onglet actif ; `aria-label="Espace cliente"`
  sur chaque `<nav>` ; images décoratives (`avatar`, `✦`) en `alt=""` /
  `aria-hidden`.
- Le `scroll-margin-top` global (6 rem) compensait le header collant ;
  dans l'espace, le header n'est plus là : vérifier que l'ancre
  `/profil#aborder` tombe juste.
- Pas de `vh` sur la zone de contenu mobile : la barre d'onglets est
  `fixed`, le contenu défile naturellement avec un `pb-28`.
- Aucun état vide silencieux : chaque tuile a son texte de repli (§4.5,
  §4.6).

---

## 9. Ce qu'on ne fait pas

- Pas de recharge express ni de paliers sur l'accueil.
- Pas de « dernière consultation il y a X jours ».
- Pas d'historique sur l'accueil.
- Pas de changement de tarif, de timing, de texte juridique : hors
  périmètre.
- Pas de déploiement sans validation explicite d'Elena.

---

## 10. Vérification avant de montrer à Elena

- [ ] Bureau 1280 px : les quatre tuiles tiennent sans défiler sur un
      écran 1280×800 (hors mot d'Elena long).
- [ ] Téléphone 390 px : ordre A → B → C → D, barre d'onglets visible,
      rien ne passe dessous.
- [ ] Les neuf états de la carte d'Elena (tableau §4.3) s'affichent
      correctement — utiliser `statutDemo` dans une page d'aperçu.
- [ ] Crédit insuffisant + Elena en ligne → « Appeler maintenant » mène à
      `/credit?pour=appeler`.
- [ ] Compte praticienne connecté → redirection `/cabinet-ew`.
- [ ] Retour Stripe `?payment=success` → bandeau vert, URL nettoyée.
- [ ] `/profil#aborder` ouvre Profil à la bonne section.
- [ ] Aucune page de l'espace indexable (comportement actuel conservé).
