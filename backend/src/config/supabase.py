from supabase import create_client
from dotenv import load_dotenv
import os

# Chargement des variables d'environnement
load_dotenv()

# Configuration du client Supabase
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Configuration du client Supabase avec la clé de service (pour les opérations admin)
supabase_admin = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
) 