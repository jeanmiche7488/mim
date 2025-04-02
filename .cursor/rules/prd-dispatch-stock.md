# PRD - Outil de Dispatch de Stock

## 1. Vue d'ensemble
Application web pour la gestion et le dispatch de stock, permettant d'optimiser la distribution des produits entre différents points de vente.

## 2. Fonctionnalités principales
- Import de fichiers de stock
- Calcul de distribution optimale
- Interface utilisateur intuitive
- Gestion des utilisateurs et des droits d'accès
- Historique des distributions

## 3. Architecture technique
### Frontend
- Next.js avec TypeScript
- Tailwind CSS pour le styling
- React Query pour la gestion des données
- React Hook Form pour les formulaires

### Backend
- FastAPI (Python)
- Supabase pour :
  - Base de données PostgreSQL
  - Authentification
  - API REST automatique
  - Temps réel pour les mises à jour
  - Stockage des fichiers

### Base de données (Supabase)
- Tables principales :
  - `users` : Gestion des utilisateurs
  - `stock` : Données de stock
  - `distributions` : Historique des distributions
  - `stores` : Points de vente
  - `products` : Catalogue produits

## 4. Interface utilisateur
- Design moderne et responsive
- Navigation intuitive
- Tableaux de bord interactifs
- Formulaires d'import de fichiers
- Visualisation des données

## 5. Sécurité
- Authentification via Supabase Auth
- Gestion des rôles et permissions
- Protection des routes API
- Validation des données

## 6. Performance
- Optimisation des requêtes Supabase
- Mise en cache des données
- Chargement progressif
- Pagination des résultats

## 7. Déploiement
- Frontend : Vercel
- Backend : Serveur dédié
- Base de données : Supabase Cloud

## 8. Maintenance
- Monitoring des performances
- Logs d'erreurs
- Sauvegardes automatiques
- Mises à jour de sécurité

## 9. Évolutions futures
- Application mobile
- API publique
- Intégration avec d'autres systèmes
- Analytics avancés

## 🎯 Objectif Principal
Développement d'un outil de répartition de stock de chaussures entre entrepôt et magasins.

## 📋 Structure du Projet

### Frontend (`/frontend`)
- Framework: Next.js/React
- Structure recommandée:
  ```
  /frontend
    /components
      /auth        # Composants d'authentification
      /dispatch    # Composants liés au dispatch
      /common     # Composants réutilisables
    /pages
    /styles
    /utils
    /hooks
  ```

### Backend (`/backend`)
- Framework: FastAPI (Python)
- Structure recommandée:
  ```
  /backend
    /api
      /routes
      /models
      /services
    /core
      /algorithms  # Logique de dispatch
      /validators  # Validation des fichiers
    /tests
    /utils
  ```

### Base de données
- PostgreSQL pour les données structurées
- Tables principales:
  - users
  - stores
  - stock_history
  - dispatch_results

## 🔒 Règles de Sécurité
1. Authentification obligatoire pour toutes les routes
2. Validation stricte des fichiers d'entrée
3. Pas de stockage de données sensibles en clair

## 📊 Règles Métier

### Dispatch de Stock
1. Contraintes de quantité minimale (P1) par magasin
2. Respect des catégories de magasins (A, B, C)
3. Diversité minimale des tailles par référence
4. Calcul en plusieurs étapes:
   - M2: Filtrage par catégorie
   - M3: Contrainte de quantité minimale
   - M4: Min(M2, M3)
   - M5: Critère de diversité
   - M6: Nombre final de magasins

### Validation des Données
1. Format des fichiers d'entrée:
   - XLS/CSV uniquement
   - Structure prédéfinie
   - Validation des types de données

## 🛠 Standards Techniques

### Code
- TypeScript pour le frontend
- Python 3.9+ pour le backend
- Tests unitaires obligatoires
- Documentation des fonctions complexes

### Performance
- Optimisation pour ~40 000 lignes
- Traitement asynchrone des calculs lourds
- Mise en cache des résultats intermédiaires

### UI/UX
- Interface épurée et moderne
- Feedback visuel des étapes
- Gestion des erreurs explicite

## 📝 Documentation
- Documentation technique à maintenir
- Guide utilisateur à créer
- Documentation des APIs

## 🚫 Limitations
- Pas d'API externe
- Deux rôles uniquement (Admin/User)
- Usage ponctuel (2-3 mois)

## ✅ Validation
Chaque PR doit:
1. Respecter ces règles
2. Inclure des tests
3. Être documentée
4. Passer les contrôles qualité 