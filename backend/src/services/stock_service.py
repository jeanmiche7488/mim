from typing import List, Optional
from datetime import datetime
from ..config.supabase import supabase, TABLES
from ..routes.stocks import Stock

class StockService:
    @staticmethod
    async def get_all_stocks() -> List[Stock]:
        """Récupère tous les stocks"""
        response = supabase.table(TABLES["stock"]).select("*").execute()
        return [Stock(**stock) for stock in response.data]

    @staticmethod
    async def get_store_stocks(store_id: int) -> List[Stock]:
        """Récupère les stocks d'un magasin spécifique"""
        response = supabase.table(TABLES["stock"]).select("*").eq("store_id", store_id).execute()
        return [Stock(**stock) for stock in response.data]

    @staticmethod
    async def get_product_stocks(product_id: int) -> List[Stock]:
        """Récupère les stocks d'un produit spécifique"""
        response = supabase.table(TABLES["stock"]).select("*").eq("product_id", product_id).execute()
        return [Stock(**stock) for stock in response.data]

    @staticmethod
    async def create_stock(stock: Stock) -> Stock:
        """Crée un nouveau stock"""
        stock.last_updated = datetime.utcnow()
        response = supabase.table(TABLES["stock"]).insert(stock.dict()).execute()
        return Stock(**response.data[0])

    @staticmethod
    async def update_stock(store_id: int, product_id: int, stock: Stock) -> Stock:
        """Met à jour un stock existant"""
        stock.last_updated = datetime.utcnow()
        response = supabase.table(TABLES["stock"]).update(stock.dict()).eq("store_id", store_id).eq("product_id", product_id).execute()
        return Stock(**response.data[0])

    @staticmethod
    async def delete_stock(store_id: int, product_id: int) -> bool:
        """Supprime un stock"""
        response = supabase.table(TABLES["stock"]).delete().eq("store_id", store_id).eq("product_id", product_id).execute()
        return len(response.data) > 0

    @staticmethod
    async def get_stock(store_id: int, product_id: int) -> Optional[Stock]:
        """Récupère un stock spécifique"""
        response = supabase.table(TABLES["stock"]).select("*").eq("store_id", store_id).eq("product_id", product_id).execute()
        if response.data:
            return Stock(**response.data[0])
        return None 