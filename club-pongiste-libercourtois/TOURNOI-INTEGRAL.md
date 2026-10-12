# Tournoi intégral

Toutes les nouvelles séries suivent les poules, les barrages puis les deux arbres de classement.
Standard, Speedy et Handicap partagent ce parcours ; les simples, doubles et restrictions restent
disponibles. Les anciens tableaux demeurent en base pour préserver l’historique.

## Utilisation

1. Créer une série avec une date et une heure de début, puis confirmer les présents. Les deux champs
   sont obligatoires et préremplis avec la date du tournoi et 09:00. Une date ou une heure invalide
   est refusée dans le formulaire et par l’API. Au moins deux participants sont nécessaires.
2. Utiliser les actions principales « Inscrire un joueur » et « Préparer les poules », au-dessus des
   onglets de la série. L’encart « Réorganiser les poules » explique les échanges manuels : cliquer
   sur un premier joueur, puis sur un autre pour échanger leurs places immédiatement. Le joueur
   sélectionné et sa poule restent affichés ; « Annuler la sélection », Échap ou un second clic sur
   ce joueur annulent la sélection sans modifier les poules. Le menu « Ajuster les poules » permet
   de rétablir la répartition automatique ou d’annuler avant le premier lancement. Après une
   annulation réussie, l’admin et le JA reviennent automatiquement aux inscriptions de la même série
   ; les joueurs, leur pointage et les paiements restent conservés. Une série déjà préparée s’ouvre
   directement sur son poste de jeu, à la phase en cours.
3. Utiliser « Lancer la poule » pour démarrer directement la série et ouvrir toutes ses feuilles,
   sans étape « Démarrer la série » ni affectation de table obligatoire : les rencontres
   s’enchaînent sur une ou deux tables repérées par les plaquettes. Les rencontres de poule se
   lancent uniquement avec ce bouton. Si un joueur a des rencontres ouvertes dans une autre poule ou
   série, un avertissement permet au JA ou à l’admin de confirmer le lancement après avoir vérifié
   sa disponibilité ou l’enchaînement des rencontres. Pour les barrages et le classement, lancer
   chaque match avec une table. En handicap, contrôler l’avance calculée ou saisir une avance
   manuelle quand un classement manque. Le lancement fige les règles de chaque feuille. Le repos du
   planning s’applique hors de la même poule. S’il n’est pas terminé, un avertissement permet au JA
   ou à l’admin de confirmer ce lancement anticipé, sans modifier le réglage de repos. Les tables
   occupées restent bloquantes.
4. La fenêtre se ferme après le lancement d’un match. Utiliser « Saisir » lorsque le résultat est
   disponible pour entrer les scores finaux des manches, avance incluse. Tab passe entre les champs
   ; Entrée enregistre. Un forfait retire seulement le perdant de cette série.
5. Le JA valide les poules, tranche les égalités restantes et ouvre les barrages. Il valide ensuite
   les barrages pour ouvrir les arbres. Gagnants et perdants continuent jusqu’à une place
   individuelle. Dès l’ouverture des barrages, « Arbres → Sortie de poules » montre les barrages au
   centre, les premiers déjà qualifiés à droite, ainsi que les destinations des gagnants et des
   perdants. Les seconds qualifiés automatiquement et les quatrièmes restent visibles. Chaque
   résultat renseigne les deux chemins ; les rencontres suivantes sont fixées après validation du JA
   et réordonnancement des têtes de série. Cette sortie reste consultable après ouverture des
   arbres. Les arbres présentent ensuite les rencontres au centre, les gagnants à droite et les
   perdants à gauche, reliés selon leurs résultats réels. Choisir le tableau principal ou le tableau
   de classement, puis cliquer sur un joueur pour retrouver sa rencontre actuelle ou sa place. La
   carte d’un exempté conduit à son prochain tour et l’affiche parmi les qualifiés en attente. La
   liste d’attente est défilable, avec son nombre de qualifiés ; le joueur suivi est mis en évidence
   et ramené dans la zone visible. Les liens de places permettent de parcourir les branches ; le fil
   de navigation indique la plage affichée et « Tableau complet » revient à la racine. Le zoom et le
   défilement permettent de parcourir les grands tableaux ; « Centrer » revient aux rencontres de
   départ. Le JA et l’admin peuvent lancer, saisir ou corriger depuis les cartes. Les prochaines
   rencontres apparaissent après les résultats, lorsque les têtes de série sont réordonnées. Le
   public dispose de la même vue en lecture seule.
6. Le planning s’ouvre filtré sur la série sélectionnée. Choisir « Toutes les séries » permet de
   consulter la vue globale. Replanifier depuis l’onglet Planning tient compte de toutes les séries
   pour éviter les conflits de joueurs et de tables. Préparer les poules calcule automatiquement
   leur horaire selon le début de la série et les tables disponibles. Toutes les feuilles d’une
   poule partagent cette prévision de lancement, sans affectation de table individuelle. La durée
   estimée tient compte des rencontres restantes : une poule de trois joueurs joue une rencontre à
   la fois ; quatre joueurs peuvent jouer sur deux tables réservées. Les poules ouvertes retiennent
   la disponibilité de leurs joueurs, sans réserver une table fictive. « Par horaire » regroupe les
   matchs par heure de départ ; « Occupation des tables » présente les heures en lignes et toutes
   les tables en colonnes. Les deux vues partagent les filtres série, horaire, recherche joueur ou
   club et « À venir seulement » (à jouer et en cours). Les couleurs distinguent les états et les
   gagnants sont en gras avec les scores. Matchs, les cartes du planning et les impressions
   utilisent le même horaire, dans le fuseau Europe/Paris : « Prévu à » indique le créneau avant
   lancement ; « Lancé à » indique ensuite le lancement réel, avec l’horaire prévu conservé entre
   parenthèses s’il diffère. Les filtres et la grille prennent le lancement réel en priorité. Les
   rencontres non lancées et non planifiées restent sans horaire, notamment quand toutes les tables
   sont retenues par des poules. Utiliser « Replanifier » pour donner un horaire aux anciennes
   poules préparées. La grille utilise des cases de 30 minutes, conserve les tables libres, indique
   les prolongations de réservation et signale les chevauchements, même avec un filtre. Les tables
   réservées par des matchs hors filtre restent indiquées comme occupées. Une colonne accueille les
   rencontres sans table ; les matchs sans horaire restent dans une section dédiée. Le JA et l’admin
   peuvent accéder à la saisie ou à la correction pour la série sélectionnée ; les poules en attente
   se lancent depuis Poules. Le public dispose des mêmes vues en lecture seule. L’impression du
   planning conserve une liste chronologique et applique le filtre de série choisi, y compris «
   Toutes les séries ». Les réglages initiaux sont 30 minutes par match et 10 minutes de repos ; les
   matchs lancés ou terminés et leurs prévisions sont conservés. Le repos reste pris en compte après
   la dernière rencontre d’une poule, même quand ses tables sont libérées. Les dates et heures des
   séries sont interprétées dans le fuseau Europe/Paris. Les joueurs sont reconnus par licence ou
   nom et club, partenaires compris ; les identités manuelles persistent après régénération.
7. L’onglet Tables présente toutes les tables du tournoi, avec les états Libre, Réservée et En
   match, la série, les joueurs et l’avancement de la poule. Il reste global quelle que soit la
   série sélectionnée. Le bouton Tables d’une poule permet au JA ou à l’admin de réserver une ou
   deux tables selon ses plaquettes, avant le lancement ou pour une poule déjà ouverte sans
   réservation. Une réservation préparée peut être modifiée ou annulée ; après lancement, les tables
   restent occupées jusqu’à résolution de toutes les rencontres, forfaits compris. Un match de
   barrage ou de classement libère sa table dès son résultat. Une durée prévue dépassée ne libère
   jamais une table. Les conflits entre séries sont vérifiés côté serveur sous le verrou de tournoi.
   Le planning évite les tables retenues par les poules ; si elles sont toutes réservées, les
   rencontres en attente restent sans table ni horaire. Les rencontres lancées ou terminées sont
   conservées. Les réservations des poules restent visibles dans la grille, même avec un filtre de
   série. Le récapitulatif « Tables des poules » reste présent dans les deux vues du planning, même
   sans horaire prévu. Les numéros réservés apparaissent aussi dans Matchs, sur les cartes du
   planning par horaire et de la grille, ainsi que dans son impression, sans affecter une table
   individuelle aux rencontres de poule. Le public voit les états des tables en lecture seule, sans
   les consignes de gestion.
8. L’icône imprimante en haut à droite d’une poule imprime ses feuilles de matchs ; celle d’un
   barrage imprime sa seule feuille. Ces actions sont disponibles pour le JA et l’admin. Chaque
   feuille porte son en-tête (Poule N - Match M, Barrage ou Classement), les noms, clubs et points
   FFTT, les cases des manches et une zone de signature. Le nombre de cases suit les règles du
   match, y compris Speedy ; les avances figées et les scores existants sont indiqués. Les feuilles
   de matchs sont regroupées automatiquement par quatre sur une page A4, en grille 2 × 2, avec des
   repères de découpe. Conserver « 1 page par feuille » dans le dialogue d’impression. Le menu
   général, réservé au JA et à l’admin, permet aussi de choisir les poules, matchs, barrages et
   arbres, classement ou planning. La vue publique ne propose pas d’impression. « Barrages et arbres
   » reprend les cartes et liaisons de la vue graphique, en A4 paysage : sortie de poules avec
   premiers qualifiés, barrages et leurs deux destinations, puis chaque plage ouverte avec perdants
   à gauche et gagnants à droite. Les pages conservent les scores, tables, exemptions, places
   finales et résultats attendus. Les grands tableaux sont découpés pour rester lisibles ; une
   rencontre peut réapparaître comme destination sur la page précédente. L’aperçu est disponible
   dans le dialogue d’impression. Le suivi public des tournois publiés se rafraîchit toutes les 15
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

Les réservations de tables des poules sont conservées dans le snapshot JSONB existant. Les anciens
snapshots sans réservation restent compatibles ; cette évolution ne nécessite pas de migration SQL.

## Migrations

L’état Neon a été vérifié avant toute migration : les modifications 0009 et 0010 existaient, mais
n’étaient pas inscrites dans l’historique. Ces fichiers tolèrent les définitions existantes
vérifiées ; les migrations enregistrées 0000–0008 sont préservées. Les snapshots et le journal
suivent les générations Drizzle.

Les évolutions 0011–0016 ont été générées avec `pnpm db:generate`, testées sur une base neuve et une
reproduction de l’état Neon, puis appliquées avec `pnpm db:migrate` via la connexion non poolée.
Aucun registre de migrations n’a été modifié directement. Aucune donnée de démonstration n’est
insérée sur Neon. La migration 0015 ajoute `tournaments.is_demo`, faux par défaut pour tous les
tournois existants. La migration 0016 rend `series_date` et `start_time` obligatoires et ajoute les
contraintes de validité. Elle complète uniquement les dates manquantes avec celle du tournoi et les
heures manquantes avec 09:00. Elle a aussi été testée sur une reproduction du schéma pré-0016
contenant des champs absents ou vides et des inscriptions et résultats existants. Elle est appliquée
sur la base locale et sur Neon : les trois dates manquantes de Neon sont complétées, les trois
heures déjà renseignées, les tournois et les inscriptions sont conservés.

```sh
pnpm exec tsx scripts/check-tournament-migrations.ts
pnpm db:migrate
pnpm exec tsx scripts/tournament-neon-preflight.ts
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

623 tests unitaires passent (`pnpm test:unit`), dont 19 pour les vues du planning : filtres
combinés, horaires équivalents, fuseau Paris, réservations longues et passage à minuit, cases
libres, chevauchements, occupation hors filtre, rencontres sans table ou horaire et distinction
entre créneau prévu et lancement réel. Cinq régressions supplémentaires couvrent les poules sans
réservation de table, le repos entre séries, la suppression des anciennes affectations et le
contrôle des tables occupées dans une même poule. Les deux vues ont été vérifiées dans le navigateur
avec plusieurs séries, des scores et la saisie JA, ainsi que la lecture publique. 72 tests couvrent
les arbres graphiques : effectifs 2–32, connexions après réordonnancement, exemptions et suivi des
joueurs jusqu’aux places, accès à chaque place et sortie de poules avec premiers en attente,
barrages, forfaits et qualifications automatiques. 33 tests supplémentaires vérifient l’impression
graphique de 2 à 32 participants : tous les matchs de classement et toutes les places sont présents,
les cartes et leurs liaisons restent dans les pages, sans modifier l’état. Le rendu imprimable a été
contrôlé dans le navigateur avec 24 joueurs en barrages, 26 en classement et 32 paires, dont des
noms longs et des scores sur sept manches. La sortie de poules a été vérifiée avec 24 joueurs, puis
après validation des barrages, dans le poste JA et la vue publique en lecture seule. Le contrôle
HTTP local joue 76 matchs jusqu’aux 24 places uniques, vérifie les lignes relationnelles et les deux
destinations, les conflits de versions et l’accès JA/public. La mise en page des feuilles a été
contrôlée visuellement ; le dialogue système d’impression et une sortie sur imprimante restent à
vérifier sur le poste du JA. Dix tests couvrent la vue des tables et vingt-deux les réservations de
poules : conflits entre séries, numéros invalides, annulation avant lancement, maintien après
résultat partiel, anciennes poules lancées match par match, libération après forfaits et exclusion
des tables réservées dans le planning. La vue Tables a été contrôlée dans le navigateur avec trois
séries simultanées et une poule sur deux tables, puis après un résultat partiel et sa fin, ainsi
qu’en lecture publique. L’affichage des deux tables d’une poule a été vérifié dans Matchs et les
deux vues du planning. Les tests distinguent ces numéros partagés d’une affectation individuelle et
les conservent sur les rencontres terminées.

Sept tests couvrent la planification des poules entières : prévision commune, capacité des tables,
durée des poules de trois ou quatre joueurs, identités partagées et repos entre séries, conservation
des feuilles ouvertes, ordre chronologique et blocage des tables réservées jusqu’aux résultats.

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

`scripts/check-pool-start-api.ts` crée et supprime son propre tournoi temporaire sur une base
locale. Avec le même `DATABASE_URL` local, `pnpm exec tsx scripts/check-pool-start-api.ts` vérifie
le premier lancement direct depuis les poules préparées, le lancement groupé sans tables, les
confirmations d’un joueur déjà engagé et d’un repos court, la reprise d’une poule partiellement
lancée, les versions concurrentes, les périmètres JA, les scores, Speedy et le handicap, puis les
tables obligatoires des barrages et du classement. Il couvre aussi les réservations entre séries,
deux demandes concurrentes sur la même table, leur persistance, leur maintien après un résultat
partiel et leur libération après le dernier résultat. Il vérifie aussi les numéros de tables des
rencontres de poule dans l’API du planning, avant lancement, après un résultat partiel et après la
fin de la poule. Il refuse une connexion à une base distante.

Avec les mêmes variables locales, `pnpm exec tsx scripts/check-series-schedule-api.ts` crée et
supprime son propre tournoi temporaire. Il vérifie les dates et heures obligatoires, les erreurs
HTTP 400, la conservation des champs omis lors d’une modification, les prévisions automatiques des
poules, leur lecture publique, le maintien du créneau après lancement, la conservation des résultats
après replanification et les conflits de versions. Il refuse une base distante.

Les tests sportifs couvrent les effectifs 2–32, notamment 5, 7, 10, 23 et 24, ainsi que forfaits,
égalités, corrections sur les deux chemins, Speedy, handicap et repos entre simples et doubles.

Dans l’administration, « Inscrire un joueur » permet de cocher plusieurs séries ouvertes. La
présence et le paiement se retrouvent dans les autres inscriptions du même joueur. Les boutons
indiquent explicitement Présent, Absent, À confirmer, Payé ou À régler.

Un administrateur peut activer « DEV · Tournoi de démonstration » à la création ou dans l’onglet
Général du tournoi. Ce marqueur est enregistré en base ; il fonctionne aussi en production et sur
Neon, indépendamment de l’adresse du site ou du mode de compilation. Les pages admin, JA et
publiques affichent un badge de démonstration ; les feuilles imprimées portent aussi ce marqueur. Le
public reste en lecture seule.

Dans un tournoi de démonstration, l’admin et le JA peuvent « Remplir la série », avec 24
participants par défaut et un choix de 2 à 32. Les joueurs sont fictifs, présents et ont des
paiements variés ; les doubles et restrictions sont respectés. Après préparation des poules, «
Simuler » termine un match et « Simuler la poule » termine ses rencontres restantes, en démarrant la
série si nécessaire. Les résultats déjà saisis et les forfaits sont conservés. Les barrages et
matchs de classement peuvent aussi être simulés individuellement ; une table leur est attribuée
automatiquement.

Les simulations utilisent les règles sportives et les avances figées au lancement. Un handicap sans
classement exige toujours une saisie ou une avance manuelle par le JA avant le lancement. Les
simulations ne réservent pas de temps de jeu réel ; chaque passage de phase reste à valider par le
JA. Les API vérifient le marqueur sous le verrou du tournoi et refusent ces actions pour un tournoi
ordinaire, sans dépendre des boutons affichés.

```sh
DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:55432/postgres?sslmode=disable' \
  E2E_ADMIN_PASSWORD='<mot de passe du serveur local>' \
  pnpm exec tsx scripts/check-demo-series-api.ts
```

Ce contrôle utilise un tournoi temporaire et vérifie authentification, périmètre, compteurs,
doubles, statuts partagés, refus après génération et annulation complète en cas de capacité
dépassée. Il vérifie aussi la suppression du tournoi après génération, puis nettoie ses données.

Avec les mêmes variables locales, `pnpm exec tsx scripts/check-demo-results-api.ts` vérifie le
marqueur persistant, les refus hors démonstration, l’accès JA/public, la conservation des scores et
les écritures concurrentes. Il joue trois séries complètes : Standard, Speedy configurable et double
avec handicap, jusqu’aux places finales uniques, puis supprime ses tournois temporaires. Ce contrôle
a aussi passé sur le handler compilé du build de production Netlify, avec la base locale.
