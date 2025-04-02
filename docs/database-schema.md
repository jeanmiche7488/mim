# Schéma de la Base de Données

## Tables Principales

### 1. `users`
Gestion des utilisateurs (gérée automatiquement par Supabase Auth)
```sql
id: uuid (primary key)
email: string (unique)
created_at: timestamp
updated_at: timestamp
role: enum ('admin', 'user')
```

### 2. `stores` (Points de vente)
```sql
id: uuid (primary key)
name: string
address: string
city: string
postal_code: string
country: string
created_at: timestamp
updated_at: timestamp
```

### 3. `products` (Catalogue produits)
```sql
id: uuid (primary key)
reference: string (unique)
name: string
description: text
category: string
unit: string
created_at: timestamp
updated_at: timestamp
```

### 4. `stock` (Stock actuel)
```sql
id: uuid (primary key)
product_id: uuid (foreign key -> products.id)
store_id: uuid (foreign key -> stores.id)
quantity: integer
last_updated: timestamp
created_at: timestamp
updated_at: timestamp
```

### 5. `distributions` (Historique des distributions)
```sql
id: uuid (primary key)
date: timestamp
status: enum ('pending', 'completed', 'cancelled')
created_by: uuid (foreign key -> users.id)
created_at: timestamp
updated_at: timestamp
```

### 6. `distribution_items` (Détails des distributions)
```sql
id: uuid (primary key)
distribution_id: uuid (foreign key -> distributions.id)
product_id: uuid (foreign key -> products.id)
source_store_id: uuid (foreign key -> stores.id)
target_store_id: uuid (foreign key -> stores.id)
quantity: integer
status: enum ('pending', 'completed', 'cancelled')
created_at: timestamp
updated_at: timestamp
```

## Relations

1. `stock` -> `products` (Many-to-One)
2. `stock` -> `stores` (Many-to-One)
3. `distributions` -> `users` (Many-to-One)
4. `distribution_items` -> `distributions` (Many-to-One)
5. `distribution_items` -> `products` (Many-to-One)
6. `distribution_items` -> `stores` (source) (Many-to-One)
7. `distribution_items` -> `stores` (target) (Many-to-One)

## Politiques de Sécurité (RLS)

### `stores`
- Lecture : Tous les utilisateurs authentifiés
- Écriture : Uniquement les administrateurs

### `products`
- Lecture : Tous les utilisateurs authentifiés
- Écriture : Uniquement les administrateurs

### `stock`
- Lecture : Tous les utilisateurs authentifiés
- Écriture : Uniquement les administrateurs

### `distributions`
- Lecture : Tous les utilisateurs authentifiés
- Création : Tous les utilisateurs authentifiés
- Modification : Uniquement les administrateurs

### `distribution_items`
- Lecture : Tous les utilisateurs authentifiés
- Création : Tous les utilisateurs authentifiés
- Modification : Uniquement les administrateurs 