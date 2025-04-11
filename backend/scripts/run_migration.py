import os
import sys
import requests
from pathlib import Path
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

# Récupérer les informations de connexion Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Erreur: Les informations de connexion Supabase sont manquantes")
    sys.exit(1)

# Lire le fichier de migration
migration_path = Path(__file__).parent.parent / "supabase" / "migrations" / "002_update_schema.sql"
with open(migration_path, 'r', encoding='utf-8') as f:
    migration_sql = f.read()

try:
    # Exécuter la migration via l'API SQL de Supabase
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/exec_sql",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json"
        },
        json={"sql": migration_sql}
    )

    if response.status_code != 200:
        print(f"Erreur lors de l'exécution de la migration: {response.text}")
        sys.exit(1)

    print("Migration exécutée avec succès!")
except Exception as e:
    print(f"Erreur lors de l'exécution de la migration: {str(e)}")
    sys.exit(1) 