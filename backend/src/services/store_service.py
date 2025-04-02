from typing import List, Optional
from ..config.supabase import supabase, TABLES
from ..routes.stores import Store

class StoreService:
    @staticmethod
    async def get_all_stores() -> List[Store]:
        """Récupère tous les magasins"""
        response = supabase.table(TABLES["stores"]).select("*").execute()
        return [Store(**store) for store in response.data]

    @staticmethod
    async def create_store(store: Store) -> Store:
        """Crée un nouveau magasin"""
        response = supabase.table(TABLES["stores"]).insert(store.dict()).execute()
        return Store(**response.data[0])

    @staticmethod
    async def update_store(store_id: int, store: Store) -> Store:
        """Met à jour un magasin existant"""
        response = supabase.table(TABLES["stores"]).update(store.dict()).eq("id", store_id).execute()
        return Store(**response.data[0])

    @staticmethod
    async def delete_store(store_id: int) -> bool:
        """Supprime un magasin"""
        response = supabase.table(TABLES["stores"]).delete().eq("id", store_id).execute()
        return len(response.data) > 0

    @staticmethod
    async def get_store(store_id: int) -> Optional[Store]:
        """Récupère un magasin par son ID"""
        response = supabase.table(TABLES["stores"]).select("*").eq("id", store_id).execute()
        if response.data:
            return Store(**response.data[0])
        return None 