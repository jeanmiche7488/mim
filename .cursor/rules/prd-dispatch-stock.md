# Règles de Développement - Outil de Dispatch de Stock

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