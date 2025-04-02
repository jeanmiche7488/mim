-- Création de la vue pour l'export des dispatches
CREATE OR REPLACE VIEW dispatch_output AS
SELECT 
    p.ean,
    p.reference,
    s.store_code as magasin,
    di.available_date as date_dispo,
    di.quantity
FROM distribution_items di
JOIN products p ON di.product_id = p.id
JOIN stores s ON di.target_store_id = s.id
JOIN distributions d ON di.distribution_id = d.id
WHERE d.status = 'completed';

-- Commentaire sur la vue
COMMENT ON VIEW dispatch_output IS 'Vue pour l''export des dispatches au format CSV'; 