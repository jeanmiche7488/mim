from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from ..services.stock_service import StockService

router = APIRouter(
    prefix="/stocks",
    tags=["stocks"]
)

class Stock(BaseModel):
    id: int | None = None
    product_id: int
    store_id: int
    quantity: int
    last_updated: str | None = None

@router.get("/", response_model=List[Stock])
async def get_stocks():
    stocks = await StockService.get_all_stocks()
    return stocks

@router.get("/{stock_id}", response_model=Stock)
async def get_stock(stock_id: int):
    stock = await StockService.get_stock_by_id(stock_id)
    if not stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return stock

@router.post("/", response_model=Stock)
async def create_stock(stock: Stock):
    return await StockService.create_stock(stock)

@router.put("/{stock_id}", response_model=Stock)
async def update_stock(stock_id: int, stock: Stock):
    updated_stock = await StockService.update_stock(stock_id, stock)
    if not updated_stock:
        raise HTTPException(status_code=404, detail="Stock not found")
    return updated_stock

@router.delete("/{stock_id}")
async def delete_stock(stock_id: int):
    success = await StockService.delete_stock(stock_id)
    if not success:
        raise HTTPException(status_code=404, detail="Stock not found")
    return {"message": "Stock deleted successfully"} 