-- Désactiver temporairement RLS
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "stores_delete_policy" ON stores;
DROP POLICY IF EXISTS "stores_update_policy" ON stores;
DROP POLICY IF EXISTS "stores_insert_policy" ON stores;
DROP POLICY IF EXISTS "stores_select_policy" ON stores;
DROP POLICY IF EXISTS "Enable all access for administrators" ON stores;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable full access for administrators" ON stores;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les magasins" ON stores;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent voir les magasins" ON stores;

-- Réactiver RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Créer une seule politique pour les utilisateurs authentifiés
CREATE POLICY "stores_authenticated_policy" ON stores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Vérifier que la politique est bien créée
SELECT * FROM pg_policies WHERE tablename = 'stores'; 