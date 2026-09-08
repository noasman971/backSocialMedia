# Audit du backend

Relecture de `routes.ts`, `auth.ts`, `index.ts`, `schema.prisma`.
Format : fichier:ligne — problème → correction.
À traiter en priorité : 1), 4), 5), 6).

---

## 1) Qu'est-ce qui est dangereux ?

1) `auth.ts:4` — secret JWT avec repli en dur : si la variable manque en prod, n'importe qui forge un token admin → supprimer le repli, échouer au démarrage.

2) `auth.ts:8` — token sans expiration, valable à vie, non révocable → durée courte + refresh.

3) `auth.ts:21` — algorithme non épinglé à la vérification → le restreindre explicitement.

4) `routes.ts:164` — `DELETE /posts/:id` vérifie le token, pas l'auteur : tout compte inscrit supprime les posts de tout le monde → charger le post, comparer `authorId`, 403 sinon.

5) `routes.ts:189` — même faille sur `DELETE /comments/:id` → idem, en autorisant aussi le propriétaire du post.

6) `routes.ts:247` — renvoie l'utilisateur brut sur une route publique : hash bcrypt, email et rôle exposés → `select` limité à id/username/createdAt.

7) `routes.ts:132`, `134`, `182` — `include: { author: true }` expose le hash de l'auteur du post, de chaque commentaire et à la création d'un commentaire → même `select`, factorisé.

8) `routes.ts:19` — multer sans `limits` ni `fileFilter` : tout fichier, toute taille → plafonner et filtrer sur une liste blanche d'images.

9) `routes.ts:16` + `index.ts:19` — nom de fichier client repris tel quel et `/uploads` servi en statique : un HTML ou SVG uploadé s'exécute sur notre domaine (XSS stocké, vol de token) → nom généré côté serveur, `nosniff`, idéalement domaine séparé.

10) `routes.ts:26-31` — aucune validation d'entrée : corps vide passe `undefined` à bcrypt, mot de passe d'un caractère accepté → schéma de validation en middleware.

11) `routes.ts:23`, `48` — pas de limitation de débit sur register/login → limiteur par IP.

12) `routes.ts:26-33` — contrôle d'unicité non atomique : deux requêtes simultanées créent deux comptes → s'appuyer sur la contrainte en base.

13) `routes.ts:31`, `58` — bcrypt synchrone, event loop bloqué ~100 ms par appel → versions asynchrones.

14) `routes.ts:28`, `55`, `60`, `233` — échecs renvoyés en 200 : supervision aveugle → 401, 409, 404 selon le cas.

15) `routes.ts:41`, `63` — le rôle est mis dans le token mais jamais lu → le brancher sur les suppressions ou le retirer.

16) `index.ts:17` — CORS ouvert à toutes les origines → restreindre via l'environnement.

17) `index.ts:22` — ni middleware d'erreur ni handler 404 : un rejet asynchrone laisse la requête suspendue → wrapper + middleware global.

18) `routes.ts:143` — id inconnu → `post` à `null`, exception sur `post.id` → 404.

19) `routes.ts:156`, `195` — suppression d'un id inexistant, erreur Prisma non capturée → 404.

20) `routes.ts:176`, `210` — like ou commentaire sur un post inexistant, violation de clé étrangère → vérifier l'existence.

21) `routes.ts:115` — post sans contenu, violation `NOT NULL` → couvert par 10).

22) `schema.prisma:48` — aucune unicité sur `Like` : le même utilisateur like cent fois, compteur falsifiable → `@@unique` sur le couple + création idempotente.

23) `routes.ts:156` — l'image reste sur le disque après suppression du post → supprimer le fichier associé.

24) `schema.prisma:32`, `45`, `54`, `62` — aucune cascade vers `User` : supprimer un compte est impossible → trancher cascade ou suppression logique.

---

## 2) Qu'est-ce qui ne tiendra pas à 500 posts ?

25) `routes.ts:85-104` — N+1 séquentiel : 3 requêtes par post, `await` dans la boucle, soit 1501 allers-retours pour 500 posts → une requête unique avec jointure et agrégats.

26) `routes.ts:79`, `133`, `255` — aucune pagination, la table entière est chargée → curseur, limite par défaut, plafond serveur.

27) `schema.prisma:29`, `30`, `40`, `51`, `59`, `60` — pas d'index sur les clés étrangères ni sur `createdAt` : balayage complet à chaque comptage, tri du feed non indexé → déclarer les index, une migration.

28) `schema.prisma:6` — SQLite verrouille en écriture au niveau du fichier → prévoir PostgreSQL, le code Prisma ne change pas.

29) `routes.ts:99` vs `146` — `created_at` dans le feed, `createdAt` dans le détail → uniformiser.

30) `routes.ts:123`, `217`, `248` — entités Prisma renvoyées brutes : toute colonne ajoutée sort dans l'API → objets de sortie explicites.

31) `routes.ts:106` — feed renvoyé en tableau nu : impossible d'ajouter un curseur sans casser les clients → enveloppe avec métadonnées.

32) `routes.ts:9` — `PrismaClient` instancié dans le module de routes : un pool par import, rien de fermé à l'arrêt → singleton dédié.

---

## 3) Comment je découperais ce code

33) `routes.ts:111`, `174`, `208`, `226` — `(req as any).userId` répété, `req.body` en `any` partout → étendre l'interface `Request`, dériver les types des schémas de validation.

34) `routes.ts:244` — `fetch_user` en snake_case au milieu de fonctions camelCase → uniformiser.

35) `routes.ts:51`, `247` — chaînes `.then()` alors que le reste est en `async/await` → un seul paradigme.

36) `routes.ts:168-239` — routes commentaires et likes déclarées en ligne, celles des posts via fonctions nommées → même traitement partout.

37) `schema.prisma:57` — modèle `Follow` présent en base, utilisé par aucune route → implémenter les endpoints ou le supprimer.

38) Aucun test, et le `.http` documente `POST /posts` en JSON alors que la route est en multipart → tests d'intégration + spec OpenAPI générée depuis les schémas.

**Découpage cible** : `db.ts` (singleton Prisma), `middleware/` (auth, erreur, validation, upload), `schemas/` (validation + typage), `routes/` (déclaration seule), `controllers/` (requête/réponse), `services/` (métier et accès Prisma), `serializers/` (forme des réponses).

**Ordre sur une semaine** : J1-J2 les points 1) 4) 5) 6) 8) 9) plus le middleware d'erreur 17) ; J3 la migration 22) 24) 27) ; J4 le découpage 32) à 37) ; J5 les tests 38), en commençant par les cas de sécurité.
