import os
import sys
import logging
from dotenv import load_dotenv
from supabase import create_client, Client
from typing import Dict, List, Optional
from calculate_distribution import (
    calculate_distribution,
    fetch_stock_data,
    get_active_parameters,
    get_stock_items,
    get_stores,
    calculate_store_distribution,
    create_distribution,
    create_distribution_items,
    update_stock_to_dispatch_status
)

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    try:
        # Chargement des variables d'environnement
        load_dotenv()
        
        # Récupération des credentials Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_KEY requises")
            return
            
        # Création du client Supabase
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Récupération des arguments
        if len(sys.argv) < 2:
            logger.error("ID du stock_to_dispatch requis")
            return
            
        stock_to_dispatch_id = sys.argv[1]
        user_id = sys.argv[2] if len(sys.argv) > 2 else None
        
        # Calcul de la distribution
        result = calculate_distribution(stock_to_dispatch_id, user_id)
        
        if result['success']:
            logger.info(f"Distribution créée avec succès - ID: {result['distribution_id']}")
            logger.info(f"Nombre d'items créés: {len(result['items'])}")
        else:
            logger.error(f"Erreur lors de la distribution: {result['error']}")
            
    except Exception as e:
        logger.error(f"Erreur lors de l'exécution du script: {str(e)}")

if __name__ == "__main__":
    main() 