# Schéma de la Base de Données

## Tables Principales

### 1. `stores` (Points de vente)
Stockage des informations des magasins
```sql
id: uuid (primary key)
store_code: varchar(10) (unique)
name: varchar(255)
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### 2. `products` (Catalogue produits)
Gestion du catalogue produits avec informations détaillées
```sql
id: uuid (primary key)
reference: varchar(20) (unique)
ean: varchar(13)
designation: varchar(255)
segment: varchar(100)
subfamily: varchar(255)
pvp: decimal(10,2)
price_category: char(1)
dispatch_category: char(1)
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### 3. `stock` (Stock actuel)
Suivi des quantités de produits par magasin et date de disponibilité
```sql
id: uuid (primary key)
product_id: uuid (foreign key -> products.id)
store_id: uuid (foreign key -> stores.id)
quantity: integer
available_date: date
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### 4. `distributions` (Vagues de distribution)
Gestion des vagues de distribution entre magasins
```sql
id: uuid (primary key)
name: varchar(255)
status: varchar(50) (default 'draft')
target_revenue: decimal(10,2)
created_by: uuid (foreign key -> auth.users.id)
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### 5. `distribution_items` (Détails des distributions)
Détail des mouvements de stock entre magasins
```sql
id: uuid (primary key)
distribution_id: uuid (foreign key -> distributions.id)
product_id: uuid (foreign key -> products.id)
source_store_id: uuid (foreign key -> stores.id)
target_store_id: uuid (foreign key -> stores.id)
quantity: integer
available_date: date
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

### 6. `stock_to_dispatch` (Stock à distribuer)
Stockage temporaire des produits à distribuer
```sql
id: uuid (primary key)
distribution_id: uuid (foreign key -> distributions.id)
product_id: uuid (foreign key -> products.id)
reference: varchar(20)
size: varchar(10)
ean_code: varchar(13)
designation: varchar(255)
collection: varchar(100)
segment: varchar(100)
quantity: integer
expedition_date: date
created_at: timestamp with time zone
updated_at: timestamp with time zone
```

## Relations

1. `stock` -> `products` (Many-to-One)
   - Un produit peut avoir plusieurs entrées de stock
   - Chaque entrée de stock est liée à un seul produit

2. `stock` -> `stores` (Many-to-One)
   - Un magasin peut avoir plusieurs entrées de stock
   - Chaque entrée de stock est liée à un seul magasin

3. `distributions` -> `auth.users` (Many-to-One)
   - Un utilisateur peut créer plusieurs distributions
   - Chaque distribution est créée par un seul utilisateur

4. `distribution_items` -> `distributions` (Many-to-One)
   - Une distribution peut contenir plusieurs items
   - Chaque item est lié à une seule distribution

5. `distribution_items` -> `products` (Many-to-One)
   - Un produit peut apparaître dans plusieurs items de distribution
   - Chaque item est lié à un seul produit

6. `distribution_items` -> `stores` (source) (Many-to-One)
   - Un magasin peut être la source de plusieurs items
   - Chaque item a une seule source

7. `distribution_items` -> `stores` (target) (Many-to-One)
   - Un magasin peut être la destination de plusieurs items
   - Chaque item a une seule destination

8. `stock_to_dispatch` -> `distributions` (Many-to-One)
   - Une distribution peut contenir plusieurs produits à distribuer
   - Chaque produit est lié à une seule distribution

9. `stock_to_dispatch` -> `products` (Many-to-One)
   - Un produit peut apparaître dans plusieurs entrées de stock à distribuer
   - Chaque entrée est liée à un seul produit

## Contraintes et Indexes

### Contraintes d'Unicité
- `stores.store_code`: Code unique pour chaque magasin
- `products.reference`: Référence unique pour chaque produit
- `stock(product_id, store_id, available_date)`: Combinaison unique pour éviter les doublons de stock

### Indexes
- `idx_stock_product`: Optimisation des recherches par produit
- `idx_stock_store`: Optimisation des recherches par magasin
- `idx_stock_date`: Optimisation des recherches par date de disponibilité
- `idx_distribution_items_stores`: Optimisation des recherches par magasins source/destination

## Politiques de Sécurité (RLS)

### `stores`
- Lecture : Tous les utilisateurs authentifiés
- Modification : Tous les utilisateurs authentifiés

### `products`
- Lecture : Tous les utilisateurs authentifiés
- Modification : Tous les utilisateurs authentifiés

### `stock`
- Lecture : Tous les utilisateurs authentifiés
- Modification : Tous les utilisateurs authentifiés

### `distributions`
- Lecture : Tous les utilisateurs authentifiés
- Création : Tous les utilisateurs authentifiés
- Modification : Uniquement le créateur de la distribution

### `distribution_items`
- Lecture : Tous les utilisateurs authentifiés
- Création : Tous les utilisateurs authentifiés
- Modification : Uniquement pour les distributions créées par l'utilisateur 