# Prévision du tournoi

La vue **Prévision** se trouve dans l’administration du tournoi et dans le poste JA. Une seule
configuration est enregistrée par tournoi. Les réglages restent privés et ne modifient pas les
inscriptions, les résultats, les horaires annoncés ou les réservations de tables.

Avant les inscriptions, choisir **Saisie manuelle** et renseigner les joueurs ou les paires
attendus. À J−1, choisir **Inscrits actuels** : les présences inconnues comptent, les absents et
forfaits sont exclus. Les inscriptions supplémentaires et la marge de durée sont deux paramètres
indépendants.

Une nouvelle estimation commence à **12 joueurs ou 12 paires**, avant l’ajout des inscriptions sur
place. Cet effectif reste modifiable ; une prévision déjà enregistrée conserve ses valeurs.

Les boutons **i** expliquent les hypothèses au clic, au clavier et sur mobile. Le **plafond de
tables** limite les tables utilisées simultanément par une série, y compris les réservations de
poules. Il ne garantit pas leur disponibilité. Laisser ce champ vide active le partage automatique
sans limite propre à cette série.

Un clic sur une série ouvre ses hypothèses et le détail des phases. Le départ peut être réglé dans
ce formulaire, y compris au clavier et sur mobile, ou déplacé dans l’agenda par pas de 15 minutes.
La durée reste calculée. **Enregistrer** conserve explicitement les hypothèses ; **Recharger**
reprend la configuration enregistrée. Un conflit de version conserve les saisies locales et demande
de recharger.

Le moteur sportif produit des rencontres virtuelles déterministes : les meilleures têtes de série
gagnent. L’ordonnanceur simule les poules complètes, les barrages et tous les matchs de classement.
Les validations de phases sont des dépendances, sans durée supplémentaire. Les tables d’une poule
restent réservées pendant les pauses entre ses matchs. Les identités connues en simple et en double
partagent le même repos ; les participants ajoutés sont distincts et anonymes. Les résultats
calculés et les identités ne sont jamais enregistrés dans la prévision.

Une série peut continuer après la fermeture, sans report automatique au lendemain. L’agenda affiche
le dépassement et la date de fin. La charge des tables correspond au maximum de tables réservées
dans chaque tranche de 30 minutes des journées configurées. La durée de match et les résultats
virtuels restent des hypothèses : les fins calculées ne sont pas garanties.

Les saisies sont limitées à 31 journées, 64 séries, 200 tables et **512 participants projetés par
série après ajout des inscriptions sur place**. Un dépassement est signalé, jamais tronqué.

## Vérification

```sh
pnpm test:unit
pnpm exec tsx scripts/check-tournament-migrations.ts
pnpm typecheck
pnpm lint:check
pnpm build
```

La migration `0017_jittery_victor_mancha` ajoute uniquement `tournament_forecasts`. Elle est générée
avec `pnpm db:generate` et appliquée avec `pnpm db:migrate` par la connexion non poolée. Les tests
couvrent les effectifs 2–32, les 76 rencontres pour 24 participants, le repos, les tables partagées,
les paires, les marges, les dépassements, Europe/Paris, les références étrangères et les écritures
concurrentes.
