from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from ..services.store_service import StoreService

router = APIRouter(
    prefix="/stores",
    tags=["stores"]
)

class Store(BaseModel):
    id: int | None = None
    name: str
    address: str
    capacity: int
    is_active: bool

@router.get("/", response_model=List[Store])
async def get_stores():
    """Récupère tous les magasins"""
    try:
        return await StoreService.get_all_stores()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Store)
async def create_store(store: Store):
    """Crée un nouveau magasin"""
    try:
        return await StoreService.create_store(store)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{store_id}", response_model=Store)
async def update_store(store_id: int, store: Store):
    """Met à jour un magasin existant"""
    try:
        updated_store = await StoreService.update_store(store_id, store)
        if not updated_store:
            raise HTTPException(status_code=404, detail="Magasin non trouvé")
        return updated_store
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{store_id}")
async def delete_store(store_id: int):
    """Supprime un magasin"""
    try:
        deleted = await StoreService.delete_store(store_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Magasin non trouvé")
        return {"message": "Magasin supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 