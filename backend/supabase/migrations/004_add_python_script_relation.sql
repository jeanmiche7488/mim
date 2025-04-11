-- Ajouter la colonne python_script_id à stock_to_dispatch
ALTER TABLE stock_to_dispatch
ADD COLUMN python_script_id UUID REFERENCES python_scripts(id);

-- Supprimer la colonne stock_to_dispatch_id de python_scripts car la relation va dans l'autre sens
ALTER TABLE python_scripts
DROP COLUMN stock_to_dispatch_id; 