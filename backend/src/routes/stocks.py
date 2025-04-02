from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from datetime import datetime
from ..services.stock_service import StockService

router = APIRouter(
    prefix="/stocks",
    tags=["stocks"]
)

class Stock(BaseModel):
    store_id: int
    product_id: int
    quantity: int
    last_updated: datetime | None = None

@router.get("/", response_model=List[Stock])
async def get_stocks():
    """Récupère tous les stocks"""
    try:
        return await StockService.get_all_stocks()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/store/{store_id}", response_model=List[Stock])
async def get_store_stocks(store_id: int):
    """Récupère les stocks d'un magasin spécifique"""
    try:
        return await StockService.get_store_stocks(store_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/product/{product_id}", response_model=List[Stock])
async def get_product_stocks(product_id: int):
    """Récupère les stocks d'un produit spécifique"""
    try:
        return await StockService.get_product_stocks(product_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=Stock)
async def create_stock(stock: Stock):
    """Crée un nouveau stock"""
    try:
        return await StockService.create_stock(stock)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{store_id}/{product_id}", response_model=Stock)
async def update_stock(store_id: int, product_id: int, stock: Stock):
    """Met à jour un stock existant"""
    try:
        updated_stock = await StockService.update_stock(store_id, product_id, stock)
        if not updated_stock:
            raise HTTPException(status_code=404, detail="Stock non trouvé")
        return updated_stock
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{store_id}/{product_id}")
async def delete_stock(store_id: int, product_id: int):
    """Supprime un stock"""
    try:
        deleted = await StockService.delete_stock(store_id, product_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Stock non trouvé")
        return {"message": "Stock supprimé avec succès"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 