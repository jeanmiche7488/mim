from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from ..services.dispatch_service import DispatchService

router = APIRouter(
    prefix="/dispatches",
    tags=["dispatches"]
)

class Dispatch(BaseModel):
    id: int | None = None
    source_store_id: int
    destination_store_id: int
    product_id: int
    quantity: int
    status: str
    created_at: str | None = None
    completed_at: str | None = None

@router.get("/", response_model=List[Dispatch])
async def get_dispatches():
    dispatches = await DispatchService.get_all_dispatches()
    return dispatches

@router.get("/{dispatch_id}", response_model=Dispatch)
async def get_dispatch(dispatch_id: int):
    dispatch = await DispatchService.get_dispatch_by_id(dispatch_id)
    if not dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return dispatch

@router.post("/", response_model=Dispatch)
async def create_dispatch(dispatch: Dispatch):
    return await DispatchService.create_dispatch(dispatch)

@router.put("/{dispatch_id}", response_model=Dispatch)
async def update_dispatch(dispatch_id: int, dispatch: Dispatch):
    updated_dispatch = await DispatchService.update_dispatch(dispatch_id, dispatch)
    if not updated_dispatch:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return updated_dispatch

@router.delete("/{dispatch_id}")
async def delete_dispatch(dispatch_id: int):
    success = await DispatchService.delete_dispatch(dispatch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Dispatch not found")
    return {"message": "Dispatch deleted successfully"} 