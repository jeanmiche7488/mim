-- Ajouter les colonnes de vérification à la table distribution_items
ALTER TABLE distribution_items
ADD COLUMN meets_ean_criteria BOOLEAN DEFAULT FALSE,
ADD COLUMN meets_reference_criteria BOOLEAN DEFAULT FALSE;

-- Mettre à jour les politiques de sécurité
ALTER TABLE distribution_items ENABLE ROW LEVEL SECURITY;

-- Créer les politiques pour les nouvelles colonnes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'distribution_items' 
        AND policyname = 'Enable read access for authenticated users'
    ) THEN
        CREATE POLICY "Enable read access for authenticated users" ON distribution_items
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'distribution_items' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users" ON distribution_items
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'distribution_items' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users" ON distribution_items
        FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;
END $$; 