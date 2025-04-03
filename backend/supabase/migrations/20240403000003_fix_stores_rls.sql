-- Désactiver complètement RLS sur la table stores
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "stores_authenticated_policy" ON stores;
DROP POLICY IF EXISTS "Enable all access for administrators" ON stores;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON stores;
DROP POLICY IF EXISTS "Enable full access for administrators" ON stores;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent modifier les magasins" ON stores;
DROP POLICY IF EXISTS "Les utilisateurs authentifiés peuvent voir les magasins" ON stores;

-- Vérifier que RLS est bien désactivé
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'stores'; 