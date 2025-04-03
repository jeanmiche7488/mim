from typing import List
from ..config.supabase import supabase
from ..models.dispatch import Dispatch

class DispatchService:
    @staticmethod
    async def get_all_dispatches() -> List[Dispatch]:
        response = supabase.table('dispatches').select('*').execute()
        return [Dispatch(**dispatch) for dispatch in response.data]

    @staticmethod
    async def get_dispatch_by_id(dispatch_id: int) -> Dispatch | None:
        response = supabase.table('dispatches').select('*').eq('id', dispatch_id).execute()
        if not response.data:
            return None
        return Dispatch(**response.data[0])

    @staticmethod
    async def create_dispatch(dispatch: Dispatch) -> Dispatch:
        response = supabase.table('dispatches').insert(dispatch.dict(exclude={'id'})).execute()
        return Dispatch(**response.data[0])

    @staticmethod
    async def update_dispatch(dispatch_id: int, dispatch: Dispatch) -> Dispatch | None:
        response = supabase.table('dispatches').update(dispatch.dict(exclude={'id'})).eq('id', dispatch_id).execute()
        if not response.data:
            return None
        return Dispatch(**response.data[0])

    @staticmethod
    async def delete_dispatch(dispatch_id: int) -> bool:
        response = supabase.table('dispatches').delete().eq('id', dispatch_id).execute()
        return len(response.data) > 0 