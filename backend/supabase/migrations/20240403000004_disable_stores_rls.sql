-- Désactiver RLS sur la table stores
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS stores_authenticated_policy ON stores;
DROP POLICY IF EXISTS stores_select_policy ON stores;
DROP POLICY IF EXISTS stores_insert_policy ON stores;
DROP POLICY IF EXISTS stores_update_policy ON stores;
DROP POLICY IF EXISTS stores_delete_policy ON stores;

-- Vérifier que RLS est bien désactivé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stores'; 