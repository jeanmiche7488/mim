# Documentation des APIs

## Configuration
- Base URL: `http://localhost:8000`
- Format: JSON
- Authentification: JWT (à implémenter)

## Routes

### Magasins (`/stores`)
- `GET /stores` : Liste tous les magasins
- `POST /stores` : Crée un nouveau magasin
- `PUT /stores/{id}` : Met à jour un magasin
- `DELETE /stores/{id}` : Supprime un magasin

### Stocks (`/stocks`)
- `GET /stocks` : Liste tous les stocks
- `GET /stocks/store/{store_id}` : Liste les stocks d'un magasin spécifique
- `GET /stocks/product/{product_id}` : Liste les stocks d'un produit spécifique
- `POST /stocks` : Crée un nouveau stock
- `PUT /stocks/{store_id}/{product_id}` : Met à jour un stock
- `DELETE /stocks/{store_id}/{product_id}` : Supprime un stock

### Dispatch (`/dispatch`)

#### Calcul de Dispatch (`POST /dispatch/calculate`)
Calcule la distribution optimale des produits en suivant un processus en 6 étapes :

1. **M2 - Filtrage par Catégorie**
   - Filtre les magasins selon leur catégorie (A, B, C)
   - Input: Liste des magasins avec leurs catégories
   - Output: Liste des magasins éligibles

2. **M3 - Contrainte de Quantité Minimale (Niveau Référence)**
   - Applique la contrainte P1 (quantité minimale par magasin)
   - Utilise le paramètre `min_reference_quantity`
   - Input: Résultats de M2
   - Output: Liste des magasins respectant la contrainte minimale

3. **M4 - Minimum entre M2 et M3**
   - Prend le minimum entre les résultats de M2 et M3
   - Input: Résultats de M2 et M3
   - Output: Liste des magasins avec les quantités minimales

4. **M5 - Critère de Diversité (Niveau EAN)**
   - Calcule le nombre maximum de magasins basé sur la diversité des tailles
   - Utilise le paramètre `min_ean_quantity`
   - Formule: `max_stores = total_quantity / min_ean_quantity`
   - Input: Résultats de M4
   - Output: Nombre maximum de magasins par produit

5. **M6 - Nombre Final de Magasins**
   - Prend le minimum entre M4 et M5
   - Trie les magasins par ventes historiques décroissantes
   - Sélectionne les N premiers magasins (N = min(M4, M5))
   - Input: Résultats de M4 et M5
   - Output: Liste finale des magasins sélectionnés

#### Historique des Dispatches
- `GET /dispatch/history` : Liste l'historique des dispatches
- `GET /dispatch/{dispatch_id}` : Détails d'un dispatch spécifique

### Paramètres (`/parameters`)
- `GET /parameters` : Récupère les paramètres actuels
- `PUT /parameters` : Met à jour les paramètres

## Gestion des Erreurs
- 400: Requête invalide
- 401: Non authentifié
- 403: Non autorisé
- 404: Ressource non trouvée
- 500: Erreur serveur

## Exemples d'Utilisation

### Calcul de Dispatch
```bash
curl -X POST http://localhost:8000/dispatch/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "requests": [
      {
        "store_id": 1,
        "product_id": 123,
        "quantity": 100,
        "category": "A"
      }
    ]
  }'
```

### Mise à jour des Paramètres
```bash
curl -X PUT http://localhost:8000/parameters \
  -H "Content-Type: application/json" \
  -d '{
    "min_reference_quantity": 5,
    "min_ean_quantity": 10
  }'
``` 