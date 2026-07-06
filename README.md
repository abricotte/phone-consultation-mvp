# Plateforme de consultation téléphonique — Elena Wolska

Consultations de voyance par téléphone, payées au forfait ou à la minute.
Marque cliente : **Elena Wolska** (elena-wolska.com). Architecture
multi-praticiennes (une seule praticienne active aujourd'hui).

## Architecture

| Couche | Techno | Hébergement |
|---|---|---|
| Frontend | Next.js 15 (App Router) | Netlify |
| Backend | Node.js / Express | Railway |
| Base de données | PostgreSQL | Supabase |
| Paiement | Stripe (MODE TEST — ne pas basculer en live sans la checklist) | — |
| Téléphonie | Twilio (conférence, bip 2 min avant fin, coupure auto) | — |

## Migrations base de données

Fichiers dans `backend/src/db/migrations/`, à exécuter dans le SQL Editor
Supabase, dans l'ordre :

| # | Fichier | Quand |
|---|---|---|
| 000 | `000_backup_pre_migration.sql` | Avant 001 — copie interne des tables + **exporter wallets/transactions en CSV hors de Supabase** (voir ci-dessous) |
| 001 | `001_multi_praticiennes.sql` | Structure multi-praticiennes, notifications, RLS, idempotence Stripe. Additive et re-exécutable |
| 002 | `002_supprimer_defaults_praticienne.sql` | ⚠️ **OBLIGATOIRE à la fin du refactoring backend** (voir ci-dessous) |

Rollback : `001_multi_praticiennes_rollback.sql`.

### Export hors Supabase avant migration

Dans le SQL Editor, exécuter puis **Download CSV** sur chaque résultat :

```sql
SELECT * FROM wallets;
SELECT * FROM transactions;
```

Alternative complète en ligne de commande (chaîne de connexion dans
Dashboard → Settings → Database) :

```
pg_dump "postgresql://postgres:[MOT_DE_PASSE]@db.brwtykemeaulbrqgzxyk.supabase.co:5432/postgres" \
  --table=public.wallets --table=public.transactions \
  --data-only --column-inserts > backup_wallets_transactions.sql
```

### ⚠️ Étape obligatoire : supprimer les DEFAULT praticienne_id

La migration 001 pose l'id d'Elena en `DEFAULT` sur toutes les colonnes
`praticienne_id` — c'est ce qui permet au backend existant de continuer à
fonctionner pendant le refactoring (transition zéro-interruption).

**Ces DEFAULT ne doivent pas survivre à l'arrivée d'une deuxième
praticienne** : toute insertion qui oublierait `praticienne_id` serait
silencieusement attribuée à Elena.

→ Quand toutes les insertions du backend passent explicitement
`praticienne_id`, exécuter `002_supprimer_defaults_praticienne.sql`
(la requête de vérification est incluse dans le fichier).

## Sécurité des données

- RLS activé sur toutes les tables, **sans policies** : tout accès direct
  avec la clé anon est refusé. Le frontend ne parle jamais à Supabase —
  uniquement au backend (JWT maison), qui utilise la service role key.
- Champs publics de la praticienne exposés uniquement via la vue
  `praticiennes_public` (nom, slug, statut en ligne, branding). Les champs
  sensibles (`stripe_account_ref`, `numero_twilio`, configs) ne sont
  jamais exposés.
- `notification_subscriptions` contient des numéros de téléphone
  (données personnelles) : aucune lecture publique, lien de
  désinscription par token dans chaque SMS.

## Variables d'environnement

### Backend (Railway)
| Variable | Rôle |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Accès BDD |
| `JWT_SECRET` | Signature des tokens |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Paiement (clés TEST) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | Téléphonie |
| `FRONTEND_URL` | Redirections Stripe Checkout |
| `BACKEND_URL` | URL publique du backend (callbacks Twilio — indispensable) |

### Frontend (Netlify)
| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL du backend, suffixée `/api` |

## ⛔ BLOQUANT AVANT PASSAGE EN LIVE

Aucune bascule Stripe live / ouverture au public tant que **chaque** case
n'est pas cochée :

- [ ] Réinitialisation de mot de passe fonctionnelle (email de reset testé)
- [ ] Règles de mot de passe côté backend : minimum 8 caractères, vérifié serveur
- [ ] Calculs d'argent 100 % en centimes entiers (aucune arithmétique
      flottante sur les montants)
- [ ] Signature Twilio (X-Twilio-Signature) active et **testée en appel réel**
- [ ] Rate limiting en place : login, inscription, recharge, notifications
- [ ] SPF/DKIM validés sur elena-wolska.com (emails Resend + reçus Stripe)

### Règle de sécurité — validation de signature Twilio

La validation est **active par défaut**. Le flag `TWILIO_VALIDATE_SIGNATURE`
n'existe que pour le debug local : si `NODE_ENV=production` et que le flag
est désactivé, **le serveur refuse de démarrer**. Pas de sécurité
optionnelle en production.

## Règles du projet

- Stripe reste en MODE TEST ; la bascule live suit une checklist dédiée
  (documentée, jamais exécutée automatiquement).
- Aucun déploiement (Netlify/Railway) sans validation explicite.
- Tarifs, timings, branding, numéros : lus depuis la config de la
  praticienne en base — jamais codés en dur.
- Toute l'interface en français.
