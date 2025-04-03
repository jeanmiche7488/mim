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
    is_active: bool = True

@router.get("/", response_model=List[Store])
async def get_stores():
    stores = await StoreService.get_all_stores()
    return stores

@router.get("/{store_id}", response_model=Store)
async def get_store(store_id: int):
    store = await StoreService.get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store

@router.post("/", response_model=Store)
async def create_store(store: Store):
    store_data = store.model_dump(exclude={'id'})
    return await StoreService.create_store(store_data)

@router.put("/{store_id}", response_model=Store)
async def update_store(store_id: int, store: Store):
    store_data = store.model_dump(exclude={'id'})
    updated_store = await StoreService.update_store(store_id, store_data)
    if not updated_store:
        raise HTTPException(status_code=404, detail="Store not found")
    return updated_store

@router.delete("/{store_id}")
async def delete_store(store_id: int):
    success = await StoreService.delete_store(store_id)
    if not success:
        raise HTTPException(status_code=404, detail="Store not found")
    return {"message": "Store deleted successfully"} 