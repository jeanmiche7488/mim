from typing import List
from ..config.supabase import supabase
from ..models.stock import Stock

class StockService:
    @staticmethod
    async def get_all_stocks() -> List[Stock]:
        response = supabase.table('stocks').select('*').execute()
        return [Stock(**stock) for stock in response.data]

    @staticmethod
    async def get_stock_by_id(stock_id: int) -> Stock | None:
        response = supabase.table('stocks').select('*').eq('id', stock_id).execute()
        if not response.data:
            return None
        return Stock(**response.data[0])

    @staticmethod
    async def create_stock(stock: Stock) -> Stock:
        response = supabase.table('stocks').insert(stock.dict(exclude={'id'})).execute()
        return Stock(**response.data[0])

    @staticmethod
    async def update_stock(stock_id: int, stock: Stock) -> Stock | None:
        response = supabase.table('stocks').update(stock.dict(exclude={'id'})).eq('id', stock_id).execute()
        if not response.data:
            return None
        return Stock(**response.data[0])

    @staticmethod
    async def delete_stock(stock_id: int) -> bool:
        response = supabase.table('stocks').delete().eq('id', stock_id).execute()
        return len(response.data) > 0 