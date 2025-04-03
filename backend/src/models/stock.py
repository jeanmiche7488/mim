from pydantic import BaseModel
from typing import Optional

class Stock(BaseModel):
    id: Optional[int] = None
    product_id: int
    store_id: int
    quantity: int
    last_updated: Optional[str] = None 