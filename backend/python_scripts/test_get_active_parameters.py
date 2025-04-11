import os
from dotenv import load_dotenv
from supabase import create_client, Client
from calculate_distribution import get_active_parameters
import logging

# Configuration des logs
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Chargement des variables d'environnement
load_dotenv()

def test_get_active_parameters():
    """
    Test de la fonction get_active_parameters
    """
    try:
        # Initialisation de la connexion Supabase
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')
        
        if not supabase_url or not supabase_key:
            logger.error("Variables d'environnement SUPABASE_URL et SUPABASE_KEY requises")
            return
            
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test de la fonction
        logger.info("Test de la fonction get_active_parameters...")
        params = get_active_parameters(supabase)
        
        # Vérification des résultats
        if params:
            logger.info("Test réussi ! Paramètres récupérés :")
            logger.info(f"min_quantity_per_reference: {params['min_quantity_per_reference']}")
            logger.info(f"min_quantity_per_ean: {params['min_quantity_per_ean']}")
        else:
            logger.error("Test échoué : Aucun paramètre récupéré")
            
    except Exception as e:
        logger.error(f"Erreur lors du test : {str(e)}")

if __name__ == "__main__":
    test_get_active_parameters() 