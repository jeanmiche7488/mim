from typing import Optional
from ..config.supabase import supabase, TABLES
from ..models.parameters import PlatformParameters

class ParameterService:
    @staticmethod
    async def get_parameters() -> PlatformParameters:
        """Récupère les paramètres de la plateforme"""
        response = supabase.table(TABLES["parameters"]).select("*").limit(1).execute()
        if response.data:
            return PlatformParameters(**response.data[0])
        raise ValueError("Aucun paramètre trouvé dans la base de données")

    @staticmethod
    async def update_parameters(parameters: PlatformParameters) -> PlatformParameters:
        """Met à jour les paramètres de la plateforme"""
        if parameters.id:
            response = supabase.table(TABLES["parameters"]).update(parameters.dict()).eq("id", parameters.id).execute()
        else:
            response = supabase.table(TABLES["parameters"]).insert(parameters.dict()).execute()
        return PlatformParameters(**response.data[0]) 