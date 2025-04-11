from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from pydantic import BaseModel
from ..services.auth import get_current_user
from ..config.supabase import supabase

router = APIRouter(
    prefix="/stock-to-dispatch",
    tags=["stock-to-dispatch"]
)

class StockToDispatchCreate(BaseModel):
    name: str
    parameters_id: Optional[str] = None
    status: str = "created"

@router.post("/")
async def create_stock_to_dispatch(
    stock_to_dispatch: StockToDispatchCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Créer le stock_to_dispatch
        response = supabase.table('stock_to_dispatch').insert({
            'name': stock_to_dispatch.name,
            'parameters_id': stock_to_dispatch.parameters_id,
            'created_by': current_user['id'],
            'status': stock_to_dispatch.status
        }).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Erreur lors de la création du stock_to_dispatch")

        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 