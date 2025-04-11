import os
from dotenv import load_dotenv
from supabase import create_client, Client
from calculate_distribution import (
    calculate_store_distribution,
    get_active_parameters,
    get_stock_items
)
import logging

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

def list_tables(supabase: Client):
    """
    Liste toutes les tables disponibles dans la base de données
    """
    try:
        # Utilisation de la fonction pg_tables pour lister les tables
        response = supabase.rpc('get_tables').execute()
        logger.info("Tables disponibles dans la base de données :")
        for table in response.data:
            logger.info(f"- {table['table_name']}")
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des tables : {str(e)}")

def test_calculate_store_distribution():
    """
    Test de la fonction calculate_store_distribution
    """
    try:
        # Initialisation de la connexion Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_KEY requises")
            return
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Liste des tables disponibles
        list_tables(supabase)
        
        # ID de test
        stock_to_dispatch_id = "1972859c-ce22-4863-b2d2-828daaa5dc2e"
        
        # Test de la fonction
        logger.info("Test de la fonction calculate_store_distribution...")
        
        # Vérification du stock_to_dispatch
        logger.info(f"Vérification du stock_to_dispatch {stock_to_dispatch_id}")
        stock = supabase.table('stock_to_dispatch').select('*').eq('id', stock_to_dispatch_id).execute()
        if not stock.data:
            logger.error(f"Stock_to_dispatch {stock_to_dispatch_id} non trouvé")
            return
        logger.info(f"Stock_to_dispatch trouvé: {stock.data[0]}")
        
        # Vérification des items associés
        logger.info("Vérification des items associés")
        items = supabase.table('stock_to_dispatch_items').select('*').eq('stock_to_dispatch_id', stock_to_dispatch_id).execute()
        if not items.data:
            logger.error(f"Aucun item trouvé pour le stock_to_dispatch {stock_to_dispatch_id}")
            return
        logger.info(f"Nombre d'items trouvés: {len(items.data)}")
        for item in items.data:
            logger.info(f"Item: {item}")
        
        # Récupération des paramètres actifs
        params = get_active_parameters(supabase)
        if not params:
            logger.error("Impossible de continuer sans paramètres actifs")
            return
            
        # Récupération des items du stock
        stock_items = get_stock_items(supabase, stock_to_dispatch_id)
        logger.info(f"Items du stock récupérés: {len(stock_items)} items")
        
        # Récupération des magasins actifs
        stores = supabase.table('stores').select('*').eq('is_active', True).execute()
        logger.info(f"Magasins actifs récupérés: {len(stores.data)} magasins")
        
        # Test de distribution manuel
        logger.info("Test de distribution manuel")
        for item in stock_items:
            logger.info(f"\nItem à distribuer:")
            logger.info(f"- ID: {item['id']}")
            logger.info(f"- Product ID: {item['product_id']}")
            logger.info(f"- Quantité: {item['quantity']}")
            logger.info(f"- Nombre de magasins max: {item['nb_max_store_final']}")
            
            # Sélectionner les magasins
            selected_stores = sorted(stores.data, key=lambda x: x['weight'], reverse=True)[:item['nb_max_store_final']]
            
            # Calculer le poids total des magasins sélectionnés
            total_weight = sum(store['weight'] for store in selected_stores)
            
            # Normaliser les poids
            normalized_weights = {store['id']: store['weight'] / total_weight for store in selected_stores}
            
            logger.info(f"Magasins sélectionnés (poids normalisés):")
            for store in selected_stores:
                quantity = int(item['quantity'] * normalized_weights[store['id']])
                logger.info(f"- Magasin {store['id']} (poids: {store['weight']}, normalisé: {normalized_weights[store['id']]:.2f}) -> {quantity} unités")
        
        # Calcul de la distribution
        distribution_items = calculate_store_distribution(
            supabase,
            stock_to_dispatch_id
        )
        
        # Vérification des résultats
        if distribution_items:
            logger.info("Test réussi ! Items de distribution créés :")
            for item in distribution_items:
                logger.info(f"Item: {item}")
        else:
            logger.error("Test échoué : Aucun item de distribution créé")
            
    except Exception as e:
        logger.error(f"Erreur lors du test : {str(e)}")

if __name__ == "__main__":
    test_calculate_store_distribution() 