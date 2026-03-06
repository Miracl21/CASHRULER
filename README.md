
# CASHRULER Mobile - Votre Assistant Financier Personnel

CASHRULER Mobile est une application de gestion financière personnelle conçue pour vous aider à suivre vos revenus, vos dépenses, à établir des budgets, à gérer vos comptes et à atteindre vos objectifs d'épargne. Elle est conçue pour être une Progressive Web App (PWA) et peut être transformée en application mobile native via Capacitor.

## Objectif du Projet

L'objectif principal de CASHRULER est de fournir aux utilisateurs un outil simple, intuitif et puissant pour :
- Comprendre où va leur argent.
- Planifier leurs dépenses et leur épargne.
- Gérer plusieurs comptes ou "postes budgétaires" virtuels.
- Se fixer et atteindre des objectifs financiers concrets.
- Obtenir des informations et des suggestions intelligentes grâce à l'IA.

## Fonctionnalités Clés

### 1. Tableau de Bord
- **Aperçu Rapide** : Affiche le solde du Compte Courant, les dépenses du jour, et la date actuelle.
- **Actions Rapides** : Boutons pour ajouter rapidement une dépense, un revenu ou effectuer un transfert.
- **Aperçu des Comptes Clés** : Visualisation des soldes des comptes principaux (Courant, Dons, Urgence, etc.).
- **Défis Budgétaires (Limites Journalières)** :
    - Permet de définir des limites de dépenses quotidiennes pour différentes catégories sur le Compte Courant.
    - Affiche la progression par rapport à ces limites et le montant restant.
    - Possibilité d'ajouter, modifier et supprimer ces limites.

### 2. Gestion des Comptes (Anciennement "Caisses")
- **Comptes Prédéfinis et Personnalisés** :
    - Comprend des comptes prédéfinis (Courant, Dons, Urgence, Investissement, Œuvres du Royaume).
    - Permet aux utilisateurs de créer leurs propres comptes personnalisés (Épargne, Projet, Autre) avec icône et couleur personnalisables.
- **Visualisation des Soldes** : Affiche le solde actuel de chaque compte.
- **Objectifs pour les Comptes** : Possibilité de définir un montant cible pour chaque compte.
- **Verrouillage des Comptes** : Fonctionnalité pour bloquer les sorties d'argent ou verrouiller complètement un compte (entrées/sorties).
- **Actions sur les Comptes** :
    - Alimenter un compte (via la création d'un Revenu pour le Compte Courant, ou via un Transfert pour les autres).
    - Modifier les détails d'un compte (nom, type (si non prédéfini), objectif, icône, couleur, statut de verrouillage).
    - Supprimer un compte personnalisé (avec réaffectation des transactions liées).

### 3. Objectifs d'Achat (Projets d'Épargne)
- **Création d'Objectifs** : Permet de définir des objectifs d'achat spécifiques (ex: Nouvel ordinateur) avec un montant cible, une échéance, une note et un compte de financement principal.
- **Suivi de la Progression** : Affiche le montant accumulé, le montant restant, le pourcentage de complétion et le temps restant avant l'échéance.
- **Contributions aux Objectifs** :
    - Bouton pour ajouter des contributions à un objectif.
    - Les contributions sont débitées du compte de financement spécifié et créditées à l'objectif.
- **Suggestion de Plan d'Épargne (IA)** :
    - Une fonctionnalité Genkit suggère un plan d'épargne hebdomadaire/mensuel pour atteindre l'objectif, basé sur le montant restant et l'échéance.
- **Modification et Suppression** : Possibilité de modifier ou supprimer des objectifs.

### 4. Transactions
- **Enregistrement des Dépenses** :
    - Titre, montant, date, note.
    - Sélection du compte source.
    - **Catégorisation obligatoire pour les dépenses du Compte Courant**.
    - **Suggestion de Catégorie (IA)** : Genkit suggère une catégorie basée sur le titre de la dépense.
- **Enregistrement des Revenus** :
    - Nom, type, montant, date, note.
    - Sélection du compte de destination.
- **Transferts entre Comptes** :
    - Permet de déplacer des fonds entre les différents comptes de l'utilisateur.
- **Liste et Filtrage** :
    - Affichage séparé des listes de dépenses et de revenus, triées par date (la plus récente en premier).
- **Modification et Suppression** : Actions pour éditer ou supprimer n'importe quelle transaction.

### 5. Budget (Mensuel pour Compte Courant)
- **Création/Modification de Budget Mensuel** :
    - Sélection du mois et de l'année.
    - Définition du **revenu de référence** alloué au Compte Courant pour le mois.
- **Allocations de Dépenses** :
    - Définition de montants alloués par catégorie de dépense pour le Compte Courant.
    - Suivi des dépenses réelles par rapport aux allocations (barre de progression).
    - **Suggestion journalière** pour les catégories non dépassées (basée sur le budget restant et les jours restants dans le mois).
- **Objectif d'Allocations aux Autres Comptes** :
    - Définition d'un **montant total à allouer** depuis le Compte Courant vers d'autres comptes (épargne, projets, etc.).
- **Allocations d'Épargne Spécifiques** :
    - Possibilité de spécifier combien allouer à chaque compte d'épargne/projet depuis le Compte Courant.
    - La somme de ces allocations spécifiques est comparée à l'objectif d'épargne total.
- **Notifications de Budget** : Alertes lorsque 50%, 75%, ou 100% d'une allocation de dépense est atteinte (configurable dans les paramètres).

### 6. Statistiques
- **Répartition des Dépenses** : Graphique circulaire (Pie Chart) montrant la part de chaque catégorie dans les dépenses totales.
- **Revenus vs Dépenses** : Graphique à barres comparant les revenus totaux et les dépenses totales.
- **Tendances Financières** : Graphique linéaire montrant l'évolution des revenus et des dépenses au fil du temps.

### 7. Paramètres
- **Personnalisation** :
    - Définir un nom d'utilisateur (optionnel).
- **Notifications** :
    - Activer/désactiver les notifications de seuil de budget.
    - Activer/désactiver les messages de motivation.
- **Gestion des Données** :
    - **Réinitialiser Toutes les Données** : Option pour effacer toutes les données de l'application stockées localement (nécessite une confirmation).

### 8. Intelligence Artificielle (Genkit)
- **Suggestion de Catégorie de Dépense** : Un flux Genkit analyse le titre d'une nouvelle dépense (pour le Compte Courant) et suggère la catégorie la plus probable.
- **Suggestion de Plan d'Épargne** : Un flux Genkit analyse les détails d'un objectif d'achat (montant cible, montant actuel, échéance) et propose un plan d'épargne hebdomadaire/mensuel avec une justification.

## Caractéristiques Techniques
- **Framework** : Next.js (App Router)
- **Langage** : TypeScript
- **UI** : React, ShadCN UI Components
- **Styling** : Tailwind CSS (avec variables CSS pour le thème)
- **Gestion d'État (Client)** : React Context API
- **Stockage Local** : `localStorage` pour la persistance des données utilisateur.
- **Fonctionnalités IA** : Genkit (Google AI)
- **Progressive Web App (PWA)** :
    - `manifest.json` pour la description de l'application.
    - `sw.js` (Service Worker) pour la mise en cache et le fonctionnement hors ligne de la coquille applicative.
- **Prêt pour Capacitor** : Configuration pour `output: 'export'` afin de faciliter l'intégration avec Capacitor pour la création d'applications natives.

## Structure du Projet (Aperçu)

- **`src/app/`** : Fichiers principaux de l'application Next.js (pages, layout, actions serveur).
- **`src/components/`** :
    - **`cashruler/`** : Composants spécifiques à la logique métier de CASHRULER (formulaires, pages, éléments d'interface).
    - **`ui/`** : Composants d'interface utilisateur ShadCN (modifiés ou non).
- **`src/contexts/`** : Contexte React pour la gestion de l'état global de l'application (`AppContext.tsx`).
- **`src/lib/`** :
    - **`cashruler/`** : Types, constantes, et logique utilitaire spécifique à CASHRULER.
    - **`utils.ts`** : Fonctions utilitaires générales (ex: `cn` pour classnames).
- **`src/ai/`** :
    - **`genkit.ts`** : Initialisation de Genkit.
    - **`flows/`** : Implémentation des flux Genkit pour les fonctionnalités IA.
- **`public/`** : Fichiers statiques (manifest.json, sw.js, images si nécessaire).
- **`package.json`** : Dépendances et scripts du projet.
- **`next.config.ts`** : Configuration de Next.js (incluant `output: 'export'`).
- **`tailwind.config.ts`** : Configuration de Tailwind CSS.
- **`tsconfig.json`** : Configuration de TypeScript.

## Démarrage Rapide

1.  Clonez le dépôt (si applicable).
2.  Installez les dépendances : `npm install` ou `yarn install`.
3.  Lancez le serveur de développement : `npm run dev` ou `yarn dev`.
4.  L'application sera accessible sur `http://localhost:9002` (ou le port spécifié).

## PWA et Intégration Capacitor

### Progressive Web App (PWA)
L'application est configurée pour être une PWA :
- Elle possède un `public/manifest.json` qui décrit l'application.
- Elle utilise un Service Worker (`public/sw.js`) pour mettre en cache les assets de l'application, permettant un chargement plus rapide et un accès hors ligne à la coquille de l'application.
- Les données sont stockées dans `localStorage`, ce qui permet une utilisation hors ligne des fonctionnalités de base.

### Intégration Capacitor (pour applications natives Android/iOS)
L'application est préparée pour une intégration avec Capacitor :
1.  **Installation des dépendances Capacitor** :
    ```bash
    npm install @capacitor/cli @capacitor/core @capacitor/android @capacitor/ios
    ```
2.  **Initialisation de Capacitor** :
    ```bash
    npx cap init "CASHRULER" "com.votre_domaine.cashruler" --web-dir=out
    ```
    (Remplacez `com.votre_domaine.cashruler` par votre ID d'application).
3.  **Ajout des plateformes natives** :
    ```bash
    npx cap add android
    npx cap add ios
    ```
4.  **Build de l'application Next.js** :
    ```bash
    npm run build
    ```
    (Cela génère le contenu statique dans le dossier `out/` grâce à `output: 'export'` dans `next.config.ts`).
5.  **Synchronisation avec Capacitor** :
    ```bash
    npx cap sync
    ```
    (Ou `npx cap sync android`, `npx cap sync ios` spécifiquement).
6.  **Ouverture dans l'IDE natif** :
    ```bash
    npx cap open android
    npx cap open ios
    ```
    À partir de là, vous pouvez builder et exécuter l'application sur des émulateurs ou des appareils réels.

**Note Importante** : Les fonctionnalités IA (Genkit) nécessiteront toujours une connexion Internet pour fonctionner, car elles appellent un backend.

## Prochaines Étapes / Améliorations Possibles
- Remplacer les icônes placeholder dans `manifest.json` et `layout.tsx` par de vraies icônes d'application.
- Améliorer la stratégie de cache du Service Worker (ex: avec Workbox via `next-pwa`).
- Ajouter une page hors ligne personnalisée plus conviviale.
- Traduction et internationalisation (i18n) côté client si besoin.
- Tests unitaires et d'intégration.
- Synchronisation des données avec un backend (Firebase Firestore, etc.) pour une persistance multi-appareils (optionnel, actuellement tout est local).
- Notifications push pour rappels de budget ou objectifs.
- Personnalisation plus poussée du thème.

---

Ce README a été généré par l'App Prototyper de Firebase Studio.
