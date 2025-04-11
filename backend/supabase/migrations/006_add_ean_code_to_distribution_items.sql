-- Ajouter la colonne ean_code à la table distribution_items
ALTER TABLE distribution_items
ADD COLUMN ean_code TEXT;

-- Mettre à jour les RLS policies
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;

-- Policy pour la lecture
CREATE POLICY "Enable read access for authenticated users" ON distribution_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy pour l'insertion
CREATE POLICY "Enable insert for authenticated users" ON distribution_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy pour la mise à jour
CREATE POLICY "Enable update for authenticated users" ON distribution_items
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true); 