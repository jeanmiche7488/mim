from typing import List, Optional
from ..config.supabase import supabase

class StoreService:
    @staticmethod
    async def get_all_stores() -> List[dict]:
        response = supabase.table('stores').select('*').execute()
        return response.data

    @staticmethod
    async def get_store_by_id(store_id: int) -> Optional[dict]:
        response = supabase.table('stores').select('*').eq('id', store_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    async def create_store(store_data: dict) -> dict:
        response = supabase.table('stores').insert(store_data).execute()
        return response.data[0]

    @staticmethod
    async def update_store(store_id: int, store_data: dict) -> dict:
        response = supabase.table('stores').update(store_data).eq('id', store_id).execute()
        return response.data[0]

    @staticmethod
    async def delete_store(store_id: int) -> bool:
        response = supabase.table('stores').delete().eq('id', store_id).execute()
        return len(response.data) > 0 