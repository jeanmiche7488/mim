from fastapi import APIRouter, HTTPException
from typing import List
from ..models.dispatch import (
    DispatchRequest,
    DispatchCalculation,
    DispatchHistory
)
from ..services.dispatch_service import DispatchService

router = APIRouter(
    prefix="/dispatch",
    tags=["dispatch"]
)

@router.post("/calculate", response_model=DispatchCalculation)
async def calculate_dispatch(requests: List[DispatchRequest]):
    """Calcule la distribution optimale des produits"""
    try:
        calculation = await DispatchService.calculate_dispatch(requests)
        # Sauvegarde l'historique
        await DispatchService.save_dispatch_history(calculation)
        return calculation
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history", response_model=List[DispatchHistory])
async def get_dispatch_history():
    """Récupère l'historique des dispatches"""
    try:
        return await DispatchService.get_dispatch_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{dispatch_id}", response_model=DispatchHistory)
async def get_dispatch_details(dispatch_id: int):
    """Récupère les détails d'un dispatch spécifique"""
    try:
        dispatch = await DispatchService.get_dispatch_details(dispatch_id)
        if not dispatch:
            raise HTTPException(status_code=404, detail="Dispatch non trouvé")
        return dispatch
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 