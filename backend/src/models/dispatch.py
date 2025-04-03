from pydantic import BaseModel
from typing import Optional

class Dispatch(BaseModel):
    id: Optional[int] = None
    source_store_id: int
    destination_store_id: int
    product_id: int
    quantity: int
    status: str
    created_at: Optional[str] = None
    completed_at: Optional[str] = None 