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

-- Politique pour les administrateurs
CREATE POLICY "Enable all access for administrators" ON stores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Vérification des politiques
SELECT * FROM pg_policies WHERE tablename = 'stores'; 