from supabase import create_client
import os
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Configuration Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Les variables d'environnement Supabase ne sont pas configurées")

# Création du client Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Tables
TABLES = {
    "stores": "stores",
    "products": "products",
    "stock": "stock",
    "distributions": "distributions",
    "distribution_items": "distribution_items"
}

# Configuration du client Supabase avec la clé de service (pour les opérations admin)
supabase_admin = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
) 