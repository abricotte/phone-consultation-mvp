# Plateforme Elena Wolska — état complet

Document de reprise, à jour du **15 août 2026**. Écrit pour qu'une
personne (ou un assistant) qui n'a rien suivi puisse comprendre ce qui
existe, pourquoi, et ce qui reste.

---

## 1. Ce que c'est

Une plateforme de consultation de voyance par téléphone, pour **Elena
Wolska**, voyante et médium, 19 ans de métier, ~20 000 consultations.

Elle complète — sans le remplacer — son site vitrine
**elena-wolska.com** (WordPress/Next, hébergé à part), qui garde le
marketing, les quiz, les témoignages et la réservation Calendly.

Deux modèles coexistent :

| Modèle | Fonctionnement |
|---|---|
| **Consultation Immédiate** | La cliente achète un crédit prépayé, appelle quand Elena est en ligne, facturée à la minute |
| **Forfaits** | Réservés et payés sur Calendly (Découverte 20 min / 58 €, Complète 45 min / 129 €), Elena lance l'appel depuis son cabinet |

### Architecture

- **Frontend** : Next.js 15 (App Router), React 19, Tailwind — Netlify
- **Backend** : Node/Express — Railway
- **Base** : Supabase (PostgreSQL, RLS refus par défaut, accès par clé de service)
- **Téléphonie** : Twilio (conférences, TwiML, détection de répondeur)
- **Paiement** : Stripe (⚠️ **encore en mode TEST**)
- **Rendez-vous** : Calendly (webhook signé)

---

## 2. Espace cliente

Cinq onglets : **Mon espace · Consultations · Mon crédit · Profil · Compte**

### Mon espace (`/dashboard`)

- **Bannière de statut pleine largeur** : « Elena est en ligne — vous
  pouvez l'appeler maintenant », « Elena est en consultation — de retour
  vers 15 h 03 », ou hors ligne avec message d'absence / heures
  habituelles.
- **Bouton d'appel** quand Elena est disponible et le crédit suffisant.
- **Recharge express** : paliers configurables par Elena, affichés en
  minutes ET en euros. Un bouton en pointillés **« Choisir une autre
  durée »** ouvre un menu déroulant (durées seules, prix révélé après
  sélection).
- **Solde en minutes**, avec « n'expire jamais » accolé au chiffre.
- **« Mon chemin avec Elena »** : les consultations passées, présentées
  comme des moments, pas comme des dépenses.
- « Votre dernière consultation : il y a 12 jours ».
- Bande **« Prendre rendez-vous »** vers Calendly.

### Consultations (`/consultations`)

Historique détaillé. Chaque ligne explique son montant :

> Durée : 9 min 49
> *10 minutes entamées × 2,90 € — toute minute commencée est due*
> **29,00 €**

Les appels sous 60 s portent « Non facturée ».

### Mon crédit (`/credit`)

Séparé de « Compte », où il était noyé entre l'email et le mot de passe.

- Le solde en haut, **en minutes puis en euros**, « n'expire jamais ».
- L'historique **groupé par mois**, pastille `+` ou `☾` avant chaque
  ligne pour distinguer entrée et sortie sans lire le montant.
- Un récapitulatif discret en pied — **sans commentaire ni incitation**.

### Profil (`/profil`)

- Date de naissance, ascendant, signe astrologique calculé.
- **« Les personnes qui comptent »** — prénom, date de naissance, lien.
- **« Ce que je veux aborder »** : la cliente prépare sa consultation.
  Ce texte est **le seul de l'espace écrit pour être lu par Elena** ; il
  remonte dans sa fiche et dans « Ma journée ».
- Mention de transparence : *« Elena voit votre prénom, votre date de
  naissance et vos proches. Personne d'autre. »*

### Compte (`/compte`)

Informations, changement de mot de passe, changement de numéro.

---

## 3. Espace praticienne — `/cabinet-ew`

**Séparé de l'espace cliente et étanche.** Un compte cliente ne peut pas
y entrer ; un compte praticienne connecté à l'espace cliente est
redirigé (le vécu a montré le danger : elle y modifiait « son » numéro,
écrasant celui de sa ligne professionnelle).

Cinq onglets : **Cabinet · Journal · Clientes · Revenus · Profil**

### Cabinet (accueil)

- **Statut** : en ligne / en consultation / hors ligne, avec extinction
  automatique après N heures.
- **« Ma journée »** — le poste de pilotage :
  - le **prochain rendez-vous** en grand, avec compte à rebours, formule,
    et **ce que la cliente veut aborder** ;
  - le reste de la journée en lignes compactes ;
  - anniversaires et « dates qui pèsent » d'aujourd'hui et demain ;
  - **« À rattraper »** : les rendez-vous passés sans consultation.
- **Quatre vignettes** : consultations abouties, tentatives sans réponse,
  minutes d'écoute, euros encaissés.
- « Dernier appel : Claire, 08:12, 2 min · voir sa fiche ».
- « Crédit détenu par vos clientes » avec infobulle *« déjà encaissé, à
  honorer en consultations »*.
- **Consultation minutée** (repliée) : lancer un forfait manuellement.
- **Santé de la ligne** : solde Twilio, minutes restantes estimées,
  « Suis-je joignable ? » (contrôles) et **« M'appeler pour vérifier »**
  (vrai appel qui rejoue le message d'accueil des clientes).

### Journal

Tous les appels, filtrables par jour / hier / mois, avec issue,
durée, montant, et **« Bloquer ce numéro »** sur chaque ligne.

### Clientes

Liste avec filtres de lecture. **Aucune hiérarchie de statut** — décision
explicite d'Elena, refusant les niveaux type Or/Argent.

**Fiche cliente** :
- coordonnées, solde, nombre de consultations, total dépensé ;
- **« Ce qu'elle veut aborber »** avec l'âge du texte, et une alerte s'il
  précède la dernière consultation ;
- ciel astral, ascendant, **proches** ;
- **carnet privé** : notes libres ;
- **augures** : prédictions avec échéance et statut (en attente / advenu
  / caduc) ;
- **dates marquantes** : ce qui pèse dans sa vie, avec récurrence ;
- **fil chronologique** mêlant consultations, notes et augures ;
- **« Bloquer ce numéro »**.

> ⚠️ **Carnet, augures et dates sont strictement privés.** Jamais
> visibles de la cliente, jamais d'envoi automatique. Vérifié en
> production avec un vrai jeton cliente : 403 sur toutes les routes,
> aucune fuite dans les réponses.

### Revenus

Cascade **encaissé TTC → TVA → HT → frais Stripe/Twilio → URSSAF →
impôt → net**, répartition par formule, export CSV, vue mensuelle.

### Profil praticienne

Dans l'ordre : **coordonnées**, **mot de passe**, puis « Tout ce que je
peux modifier » :

- **Tarifs** : menus déroulants (prix/min 1,90 → 4,90 €), durées et prix
  de forfaits, **paliers de recharge en pastilles à cocher**.
- **Récapitulatif de contrôle** avant enregistrement, énonçant ce que les
  clientes verront, avec le **prix/minute implicite** de chaque forfait.
- **Textes** : baseline, signature, message d'absence **programmable par
  dates**, heures habituelles.
- **Réglages** : TVA, URSSAF, impôt, coûts fixes, seuil d'alerte Twilio,
  seuil « habituée ». **Stockés en base**, plus dans le navigateur.
- Changement de numéro **vérifié par appel** avant enregistrement.
- **« Voir mon site comme une cliente »**.

---

## 4. Chaîne d'argent

1. La cliente recharge → **Stripe** → webhook → crédit au portefeuille
2. Elle appelle → **verrou atomique** (une seule consultation à la fois)
3. Twilio appelle les deux et les réunit en conférence
4. À la fin : durée arrondie à la minute supérieure, débit du portefeuille

### Règles de facturation

- **Toute minute entamée est due.**
- **Franchise : moins de 60 s = 0 €** (coupure, faux départ).
- **Répondeur détecté = non facturé.**
- **Appel non abouti = non facturé.**
- Coupure automatique à l'épuisement du crédit, avec signal sonore avant.
- Forfaits Calendly : `montant_paye` porté par la session, pas de débit.

### Deux courses corrigées

- **Double débit** : `finalizeSession` lisait le statut puis écrivait
  plusieurs `await` plus tard. Twilio notifiant la fin pour **chaque
  jambe**, trois exécutions débitaient. Corrigé par une **prise
  atomique** (condition de statut dans l'`UPDATE`). Testé.
- **Appels simultanés** : `verrouillerConsultation` était déjà atomique.
  La seconde cliente reçoit un refus explicite, sans appel ni débit.

---

## 5. Calendly

- **Webhook signé** (HMAC-SHA256 sur le corps brut, comparaison à temps
  constant, fenêtre de 5 min contre le rejeu), monté avant
  `express.json()`.
- `invitee.created` → rattachement par **numéro** puis **email**, création
  de fiche si inconnue (`origine = 'calendly'`), enregistrement du
  rendez-vous.
- `invitee.canceled` → statut `annule`.
- **Idempotent** : `calendly_event_uri` unique, un réessai ne duplique
  rien.
- **Reprise de fiche à l'inscription** : une cliente venue par Calendly
  qui s'inscrit ensuite **récupère sa fiche** au lieu d'être bloquée par
  « email déjà utilisé ». Garde-fou : jamais un compte réel.
- Statuts : `prevu` / `honore` / `annule`. **« Honoré » n'est posé qu'à
  la réussite de l'appel** — un appel raté laisse une tentative et le
  rendez-vous reste visible. « À rattraper » est **déduit**, pas stocké.

Scripts : `scripts/calendly-webhook.ps1` (créer l'abonnement) et
`scripts/calendly-diagnostic.ps1` (diagnostic + rattrapage).

---

## 6. Base de données

Migrations **001 → 011**, toutes appliquées. Additives et idempotentes.

Tables principales : `users`, `wallets`, `transactions`, `sessions`,
`consultants`, `praticiennes`, `proches`, `notes_praticienne` (carnet +
augures), `dates_marquantes`, `visites_agregees`, `verifications_numero`,
`numeros_bloques`, `rendez_vous`.

Réglages en JSONB sur `praticiennes` : `config_tarifs` (tarifs, forfaits,
paliers, réglages fiscaux), `config_branding` (textes, absence, heures),
`messages_vocaux`.

---

## 7. Tests automatisés

| Fichier | Couvre |
|---|---|
| `telephone.test.js` | Normalisation des numéros (25 cas) |
| `calls.race.test.js` | Double débit — 3 notifications concurrentes |
| `tarifs.test.js` | Garde-fous tarifaires (21 vérifications) |
| `blocage.test.js` | Blocage résistant aux formats (20) |
| `calendly.test.js` | Signature et payloads (44) |

`node src/utils/<nom>.test.js`

---

## 8. Décisions structurantes

Ce qui explique le code mieux que le code lui-même.

- **Rien ne disparaît sans décision d'Elena.** Un rendez-vous passé
  grise, il ne s'efface pas. Un appel raté laisse une trace.
- **Le carnet est privé, sans exception.** Ces outils servent SA
  mémoire, pas une machine à relancer.
- **Pas de hiérarchie de clientes** (Or/Argent refusés).
- **Pas de suivi individuel de visite** — refusé explicitement : « je ne
  veux pas qu'elle sache que je regarde ». La fréquentation reste
  **agrégée et anonyme**, sans aucun identifiant.
- **Les minutes plutôt que les euros** partout sauf dans « Mon crédit ».
- **« N'expire jamais »** est la promesse centrale — et ce qui rend
  défendable l'absence de remboursement au-delà de 14 jours.
- **Le serveur fait foi** sur toute règle qui touche à l'argent.
- **Ton d'invitation, jamais de pression** : pas de compte à rebours, pas
  d'urgence fabriquée, pas d'incitation à recharger dans les pages de
  comptes.

---

## 9. Ce qui reste

### À vérifier (jamais exercé)

- **Un appel réel** → confirmer une seule ligne de débit
- **Stripe en réel** (encore en mode test)

### En cours

- Sous-domaine **espace.elena-wolska.com** — site Netlify créé
  (`effulgent-jelly-b4ccbe`), domaine à rattacher
- Le sous-domaine ne doit **pas** dupliquer la page d'accueil du site
  vitrine : il devrait ouvrir directement sur l'espace, et être
  **non indexable**
- Textes juridiques à coller dans WordPress
  (`docs/textes-juridiques-a-ajouter.md`) — **dont une phrase de la
  politique de confidentialité devenue fausse**

### Bloqué

- **Resend + DNS** → mot de passe oublié, changement d'email
- **Supabase Storage** → photo de profil, messages vocaux

### Prévu

- **Carte du jour** (oracle d'Elena, en cours de création) — priorité
  n°1 côté cliente
- Jalons de relation (« notre 12e consultation »), anniversaires
- Fiche express des appels entrants
- Séparation **Encaissé / Réalisé** dans Revenus (attente du comptable)
- Marrainage, résultats de quiz rapatriés

---

## 10. Règles absolues

1. **Ne jamais toucher à elena-wolska.com ni au site Netlify
   `sunny-paletas-ba8d15`.** Production, clientes réelles.
2. **Aucun push sans accord explicite d'Elena.** Chaque build est
   facturé — grouper les envois, ne jamais pousser commit par commit.
3. **Stripe reste en mode test** jusqu'à décision contraire.
4. **Demander avant toute opération destructive** en base.
5. Les scripts `.ps1` doivent être en **ASCII pur** (PowerShell 5.1 lit
   sans BOM en ANSI : un tiret long casse la syntaxe).
