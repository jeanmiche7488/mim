-- Mise à jour de la table stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS zone VARCHAR(50),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS entity_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS store_code VARCHAR(10) UNIQUE,
ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS dispatch_category CHAR(1),
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Création d'un index sur le code du magasin
CREATE INDEX IF NOT EXISTS idx_stores_store_code ON stores(store_code);

-- Mise à jour des politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent voir les magasins" ON stores;

CREATE POLICY "Les utilisateurs authentifiés peuvent voir les magasins"
    ON stores FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les administrateurs peuvent gérer les magasins"
    ON stores FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin'); 