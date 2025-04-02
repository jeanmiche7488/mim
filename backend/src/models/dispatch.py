from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum

class StoreCategory(str, Enum):
    A = "A"
    B = "B"
    C = "C"

class DispatchStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class DispatchRequest(BaseModel):
    store_id: int
    product_id: int
    quantity: int
    category: StoreCategory
    min_quantity: int = 0  # P1: Quantité minimale par magasin

class DispatchResult(BaseModel):
    id: Optional[int] = None
    store_id: int
    product_id: int
    quantity: int
    status: DispatchStatus
    timestamp: datetime = datetime.utcnow()
    category: StoreCategory
    diversity_score: float = 0.0  # Score de diversité des tailles

class DispatchCalculation(BaseModel):
    m2_result: List[DispatchResult]  # Filtrage par catégorie
    m3_result: List[DispatchResult]  # Contrainte de quantité minimale
    m4_result: List[DispatchResult]  # Min(M2, M3)
    m5_result: List[DispatchResult]  # Critère de diversité
    m6_result: List[DispatchResult]  # Nombre final de magasins

class DispatchHistory(BaseModel):
    id: int
    calculation_id: int
    store_id: int
    product_id: int
    quantity: int
    status: DispatchStatus
    timestamp: datetime
    category: StoreCategory 