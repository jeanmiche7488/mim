-- Mise à jour des tables existantes

-- Mise à jour de la table stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS store_code VARCHAR(10) UNIQUE,
DROP COLUMN IF EXISTS address,
DROP COLUMN IF EXISTS city,
DROP COLUMN IF EXISTS postal_code,
DROP COLUMN IF EXISTS country;

-- Mise à jour de la table products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS ean VARCHAR(13),
ADD COLUMN IF NOT EXISTS designation VARCHAR(255),
ADD COLUMN IF NOT EXISTS segment VARCHAR(100),
ADD COLUMN IF NOT EXISTS subfamily VARCHAR(255),
ADD COLUMN IF NOT EXISTS pvp DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS price_category CHAR(1),
ADD COLUMN IF NOT EXISTS dispatch_category CHAR(1),
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS unit;

-- Mise à jour de la table stock
ALTER TABLE stock 
ADD COLUMN IF NOT EXISTS available_date DATE NOT NULL DEFAULT CURRENT_DATE,
DROP COLUMN IF EXISTS last_updated;

-- Mise à jour de la table distributions
ALTER TABLE distributions 
ADD COLUMN IF NOT EXISTS name VARCHAR(255),
DROP COLUMN IF EXISTS date;

-- Mise à jour de la table distribution_items
ALTER TABLE distribution_items 
ADD COLUMN IF NOT EXISTS available_date DATE NOT NULL DEFAULT CURRENT_DATE,
DROP COLUMN IF EXISTS status;

-- Indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_stock_date ON stock(available_date);
CREATE INDEX IF NOT EXISTS idx_distribution_items_stores ON distribution_items(source_store_id, target_store_id);

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable write access for admins only" ON stores;

-- Nouvelles politiques RLS
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les magasins"
    ON stores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les produits"
    ON products FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent voir le stock"
    ON stock FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les distributions"
    ON distributions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des distributions"
    ON distributions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Les utilisateurs authentifiés peuvent supprimer leurs distributions"
    ON distributions FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les items de distribution"
    ON distribution_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des items de distribution"
    ON distribution_items FOR INSERT
    TO authenticated
    WITH CHECK (true); 