-- Ajouter la contrainte de vérification pour le statut
ALTER TABLE stock_to_dispatch
ADD CONSTRAINT stock_to_dispatch_status_check
CHECK (status IN ('created', 'file_loaded', 'max_shops_calculated', 'distribution_calculated', 'completed', 'error')); 