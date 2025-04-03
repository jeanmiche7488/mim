-- Désactiver temporairement RLS
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Enable read access for all users" ON stores;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable insert access for all users" ON stores;
DROP POLICY IF EXISTS "Enable update access for all users" ON stores;
DROP POLICY IF EXISTS "Enable delete access for all users" ON stores;

-- Réactiver RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Créer les nouvelles politiques
CREATE POLICY "stores_select_policy" ON stores
    FOR SELECT
    USING (true);

CREATE POLICY "stores_insert_policy" ON stores
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "stores_update_policy" ON stores
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "stores_delete_policy" ON stores
    FOR DELETE
    USING (true);

-- Vérifier que les politiques sont bien créées
SELECT * FROM pg_policies WHERE tablename = 'stores'; 