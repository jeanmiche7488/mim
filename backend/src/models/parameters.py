from pydantic import BaseModel, Field
from typing import Optional

class PlatformParameters(BaseModel):
    id: Optional[int] = None
    min_reference_quantity: int = Field(
        description="Quantité minimale d'une référence par magasin (niveau référence)",
        ge=1
    )
    min_ean_quantity: int = Field(
        description="Quantité minimale par taille (niveau EAN)",
        ge=1
    )
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "min_reference_quantity": 5,
                "min_ean_quantity": 10,
                "created_at": "2024-03-20T10:00:00Z",
                "updated_at": "2024-03-20T10:00:00Z"
            }
        } 