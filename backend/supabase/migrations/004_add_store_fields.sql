-- Ajout des champs manquants à la table stores
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS zone VARCHAR(255),
ADD COLUMN IF NOT EXISTS country VARCHAR(255),
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS entity_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS brand VARCHAR(255),
ADD COLUMN IF NOT EXISTS dispatch_category VARCHAR(255),
ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10),
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Suppression des anciennes politiques
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable all access for administrators" ON stores;

-- Création des nouvelles politiques
CREATE POLICY "Enable read access for authenticated users" ON stores
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON stores
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON stores
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON stores
    FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Enable all access for administrators" ON stores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 