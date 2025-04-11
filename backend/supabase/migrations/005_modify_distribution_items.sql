-- Supprimer la colonne source_store_id qui n'est pas utilisée
ALTER TABLE distribution_items
DROP COLUMN source_store_id;

-- Mettre à jour les politiques RLS si nécessaire
CREATE POLICY "Les utilisateurs authentifiés peuvent voir les distribution_items"
    ON distribution_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent créer des distribution_items"
    ON distribution_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Les utilisateurs authentifiés peuvent modifier les distribution_items"
    ON distribution_items FOR UPDATE
    TO authenticated
    USING (true); 