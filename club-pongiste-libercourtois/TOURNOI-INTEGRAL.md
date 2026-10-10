# Tournoi intégral

Toutes les nouvelles séries suivent les poules, les barrages puis les deux arbres de classement.
Standard, Speedy et Handicap partagent ce parcours ; les simples, doubles et restrictions restent
disponibles. Les anciens tableaux demeurent en base pour préserver l’historique.

## Utilisation

1. Créer une série et confirmer les présents. Au moins deux participants sont nécessaires.
2. Générer les poules, échanger les joueurs si nécessaire, puis démarrer.
3. Lancer chaque match avec sa table. En handicap, contrôler l’avance calculée ou saisir une avance
   manuelle quand un classement manque. Les règles sont figées au lancement.
4. Saisir les scores finaux des manches, avance incluse. Tab passe entre les champs ; Entrée
   enregistre. Un forfait retire seulement le perdant de cette série.
5. Le JA valide les poules, tranche les égalités restantes et ouvre les barrages. Il valide ensuite
   les barrages pour ouvrir les arbres. Gagnants et perdants continuent jusqu’à une place
   individuelle.
6. Consulter et imprimer le planning commun à toutes les séries, puis replanifier depuis l’onglet
   Planning. Les réglages initiaux sont 30 minutes par match et 10 minutes de repos ; les matchs
   lancés ou terminés sont conservés. Les dates et heures des séries sont interprétées dans le
   fuseau Europe/Paris. Les joueurs sont reconnus par licence ou nom et club, partenaires compris ;
   les identités manuelles persistent après régénération.
7. Choisir les feuilles, contrôler leur aperçu puis Imprimer : poules, matchs, barrages et arbres,
   classement ou planning. Le suivi public des tournois publiés se rafraîchit toutes les 15
   secondes. Internet est nécessaire.

Les inscriptions et règles sportives sont figées après génération. Annuler les poules les rend
modifiables avant démarrage. Après démarrage, utiliser le forfait dans le poste JA. Paiement et
notes restent modifiables.

## Persistance et concurrence

Drizzle utilise `pg` pour les tournois. Un verrou transactionnel de tournoi couvre scores, planning,
inscriptions et paramètres. Les tables Drizzle `integral_pools`, `integral_pool_members`,
`integral_phases`, `integral_ranges`, `integral_matches`, `integral_sets` et `integral_placements`
représentent les poules, phases, plages, deux destinations de chaque match, règles figées et places
uniques. Le même état est conservé dans `integral_series.state` (JSONB typé) pour rejouer les
corrections, avec version monotone, y compris après annulation. Les tables et ce document sont
synchronisés dans la même transaction. Une correction qui modifierait les participants d’un match
dépendant lancé ou terminé est refusée.

## Migrations

L’état Neon a été vérifié avant toute migration : les modifications 0009 et 0010 existaient, mais
n’étaient pas inscrites dans l’historique. Ces fichiers tolèrent les définitions existantes
vérifiées ; les migrations enregistrées 0000–0008 sont préservées. Les snapshots et le journal
suivent les générations Drizzle.

Les évolutions 0011–0014 ont été générées avec `pnpm db:generate`, testées sur une base neuve et une
reproduction de l’état Neon, puis appliquées avec `pnpm db:migrate` via la connexion non poolée.
Aucun registre de migrations n’a été modifié directement. Aucune donnée de démonstration n’est
insérée sur Neon.

```sh
pnpm exec tsx scripts/check-tournament-migrations.ts
pnpm exec tsx scripts/tournament-neon-preflight.ts
pnpm db:migrate
```

## Validation reproductible

```sh
pnpm typecheck
pnpm lint:check
pnpm test:unit
pnpm build
```

Le contrôle TypeScript, le lint et le build passent. La configuration du club purge uniquement les
tags CDN `config` et `club`, pris en charge par le SDK Netlify. Trois tests de régression vérifient
la purge ciblée, l’absence d’appel en local et la sauvegarde conservée si le CDN échoue.
`style:check` ne peut pas s’exécuter : stylelint n’est pas installé dans ce projet.

392 tests unitaires passent. Le contrôle HTTP local joue 76 matchs jusqu’aux 24 places uniques,
vérifie les lignes relationnelles et les deux destinations, les conflits de versions et l’accès
JA/public. Les feuilles ont été contrôlées dans l’aperçu de l’application ; le dialogue système
d’impression et une sortie sur imprimante restent à vérifier sur le poste du JA.

Pour jouer la démonstration sans Neon, démarrer chaque commande dans un terminal distinct :

```sh
pnpm exec tsx scripts/local-tournament.ts
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable' pnpm exec nuxt dev --port 3001
pnpm exec tsx scripts/check-integral-api.ts
```

Le jeu de démonstration inclut la configuration du club, ses horaires et ses tarifs pour les pages
publiques. Le client Drizzle utilise `pg` pour PostgreSQL local et conserve HTTP pour Neon. Les
DevTools sont désactivés par défaut ; ajouter `NUXT_DEVTOOLS=true` pour les activer volontairement.

Le dernier contrôle est destiné à une base de démonstration neuve. Il vérifie les API du club
utilisées par le pied de page et joue 24 participants jusqu’aux places 1–24 et vérifie transactions,
scores invalides, versions concurrentes, annulation/régénération, identités persistantes et accès
JA/public. Ouvrir `/tournois/demo-integral/ja` (JA démonstration, PIN local 1234). Arrêter les deux
processus détruit la base en mémoire.

Les tests sportifs couvrent les effectifs 2–32, notamment 5, 7, 10, 23 et 24, ainsi que forfaits,
égalités, corrections sur les deux chemins, Speedy, handicap et repos entre simples et doubles.
