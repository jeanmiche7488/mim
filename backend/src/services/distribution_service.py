from typing import Dict, List, Optional
from ..config.supabase import supabase
from ..python_scripts.calculate_distribution import calculate_distribution

class DistributionService:
    @staticmethod
    async def calculate_distribution(stock_to_dispatch_id: str, user_id: Optional[str] = None) -> Dict:
        """
        Calcule et crée une distribution pour un stock_to_dispatch donné
        
        Args:
            stock_to_dispatch_id (str): ID du stock à dispatcher
            user_id (str, optional): ID de l'utilisateur qui effectue la distribution
            
        Returns:
            Dict: Résultat de la distribution avec les items créés
        """
        try:
            result = calculate_distribution(stock_to_dispatch_id, user_id)
            return result
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    @staticmethod
    async def get_distribution(distribution_id: str) -> Optional[Dict]:
        """
        Récupère une distribution par son ID
        
        Args:
            distribution_id (str): ID de la distribution
            
        Returns:
            Optional[Dict]: Distribution ou None si non trouvée
        """
        try:
            response = supabase.table('distributions').select('*').eq('id', distribution_id).execute()
            if not response.data:
                return None
            return response.data[0]
        except Exception as e:
            return None

    @staticmethod
    async def get_distribution_items(distribution_id: str) -> List[Dict]:
        """
        Récupère les items d'une distribution
        
        Args:
            distribution_id (str): ID de la distribution
            
        Returns:
            List[Dict]: Liste des items de la distribution
        """
        try:
            response = supabase.table('distribution_items').select('*').eq('distribution_id', distribution_id).execute()
            return response.data if response.data else []
        except Exception as e:
            return [] 