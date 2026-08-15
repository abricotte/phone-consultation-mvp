# Si le déplacement Netlify tourne mal

Écrit le 15 août 2026, avant de déplacer le site de test entre les deux
équipes Netlify.

---

## Ce qui ne peut PAS être perdu

**Le code de la plateforme.** Il vit sur GitHub, pas sur Netlify.
Netlify ne fait que le lire pour construire le site — supprimer un site
Netlify n'efface pas une ligne de code. Le dépôt est complet ici :

> https://github.com/abricotte/phone-consultation-mvp

Un repère a été posé sur l'état d'aujourd'hui :
`avant-deplacement-netlify-2026-08-15`

**Les comptes, soldes, consultations, fiches clientes.** Tout vit dans
Supabase, une base de données totalement indépendante de Netlify.

**Le serveur applicatif.** Il est sur Railway, également indépendant.

En clair : **Netlify n'héberge que l'affichage.** Le pire qui puisse
arriver est de devoir reconstruire un site — trente minutes, aucune
donnée perdue.

---

## Ce qui EST réellement en danger

Une seule chose : **la zone DNS de elena-wolska.com**, qui est gérée par
Netlify. Elle décide où pointe le vrai site et où arrivent les emails.

Son état exact d'avant l'opération est sauvegardé dans
`dns-elena-wolska-2026-08-15.txt`, même dossier.

### Ce qu'il ne faut jamais toucher

| Enregistrement | Rôle |
|---|---|
| `elena-wolska.com` → **35.157.26.135** et **63.176.8.218** | Le vrai site |
| `www.elena-wolska.com` | Le vrai site |
| Les lignes **MX** | Les emails. Les supprimer = plus aucun mail reçu |
| Les serveurs de noms `dns1..4.p05.nsone.net` | Toute la zone |

**Ajouter** une ligne `espace` est sans danger. **Modifier ou
supprimer** une ligne existante est le seul geste qui peut casser le
site de production.

### Si une ligne a été modifiée par erreur

Ouvrir le fichier de sauvegarde, retrouver la valeur d'origine, et la
remettre. La propagation prend de quelques minutes à une heure.

---

## Restaurer le site de test

Si le nouveau site ne fonctionne pas, l'ancien
(`singular-sopapillas-c977b4`) est toujours là tant qu'il n'a pas été
supprimé — **ne le supprimer qu'une fois le nouveau vérifié**.

Et s'il a été supprimé quand même : recréer un site depuis GitHub. Le
fichier `netlify.toml` à la racine du dépôt contient tous les réglages,
il n'y a rien à saisir sauf :

```
NEXT_PUBLIC_API_URL = https://phone-consultation-mvp-production.up.railway.app/api
```

---

## Ordre sûr de l'opération

1. Créer le nouveau site dans l'équipe qui détient le domaine
2. Vérifier qu'il s'affiche sur son adresse `.netlify.app`
3. **Seulement ensuite**, y ajouter `espace.elena-wolska.com`
4. Vérifier que **elena-wolska.com fonctionne toujours**
5. **Seulement ensuite**, supprimer l'ancien site

À aucun moment il n'est nécessaire d'ouvrir les réglages de
`sunny-paletas` ni de modifier le domaine principal.
