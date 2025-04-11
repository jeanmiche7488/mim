-- Ajouter la colonne stock_to_dispatch_id à distributions si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'distributions' 
        AND column_name = 'stock_to_dispatch_id'
    ) THEN
        ALTER TABLE distributions
        ADD COLUMN stock_to_dispatch_id UUID REFERENCES stock_to_dispatch(id);
    END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_stock_to_dispatch_distribution_id ON stock_to_dispatch(distribution_id);
CREATE INDEX IF NOT EXISTS idx_distributions_stock_to_dispatch_id ON distributions(stock_to_dispatch_id);

-- Mettre à jour les politiques RLS pour les nouvelles colonnes
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'distributions' 
        AND policyname = 'Les utilisateurs authentifiés peuvent voir les distributions liées'
    ) THEN
        CREATE POLICY "Les utilisateurs authentifiés peuvent voir les distributions liées"
            ON distributions FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'distributions' 
        AND policyname = 'Les utilisateurs authentifiés peuvent créer des distributions liées'
    ) THEN
        CREATE POLICY "Les utilisateurs authentifiés peuvent créer des distributions liées"
            ON distributions FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'distributions' 
        AND policyname = 'Les utilisateurs authentifiés peuvent modifier les distributions liées'
    ) THEN
        CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les distributions liées"
            ON distributions FOR UPDATE
            TO authenticated
            USING (auth.uid() = created_by);
    END IF;
END $$; 