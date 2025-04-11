from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from ..services.distribution_service import DistributionService
from ..auth.auth import get_current_user

router = APIRouter()

@router.post("/calculate/{stock_to_dispatch_id}")
async def calculate_distribution(
    stock_to_dispatch_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Calcule et crée une distribution pour un stock_to_dispatch donné
    
    Args:
        stock_to_dispatch_id (str): ID du stock à dispatcher
        current_user (dict): Utilisateur authentifié
        
    Returns:
        Dict: Résultat de la distribution
    """
    try:
        result = await DistributionService.calculate_distribution(
            stock_to_dispatch_id=stock_to_dispatch_id,
            user_id=current_user.get('id')
        )
        
        if not result.get('success', False):
            raise HTTPException(status_code=400, detail=result.get('error', 'Erreur inconnue'))
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{distribution_id}")
async def get_distribution(
    distribution_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Récupère une distribution par son ID
    
    Args:
        distribution_id (str): ID de la distribution
        current_user (dict): Utilisateur authentifié
        
    Returns:
        Dict: Distribution
    """
    try:
        distribution = await DistributionService.get_distribution(distribution_id)
        if not distribution:
            raise HTTPException(status_code=404, detail="Distribution non trouvée")
            
        items = await DistributionService.get_distribution_items(distribution_id)
        distribution['items'] = items
        
        return distribution
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 