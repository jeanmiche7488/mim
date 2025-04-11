from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from dotenv import load_dotenv
import httpx
import io
import json
from pydantic import BaseModel
from typing import Dict, Any
import tempfile
import subprocess
import sys
import logging
from supabase import create_client, Client

# Charger les variables d'environnement
load_dotenv()

# Configuration de l'API Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def insert_records(records):
    async with httpx.AsyncClient() as client:
        url = f"{SUPABASE_URL}/rest/v1/stock"
        response = await client.post(url, headers=HEADERS, json=records)
        response.raise_for_status()
        return response.json()

@app.post("/api/process-csv/{distribution_id}")
async def process_csv(distribution_id: str, file: UploadFile = File(...)):
    try:
        # Lire le fichier CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Convertir le DataFrame en liste de dictionnaires
        records = df.to_dict('records')
        
        # Insérer les données par lots de 1000
        batch_size = 1000
        total_inserted = 0
        
        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            await insert_records(batch)
            total_inserted += len(batch)
        
        return {
            "message": f"Données insérées avec succès",
            "total_records": total_inserted
        }
    except Exception as e:
        return {"error": str(e)}

class ScriptExecutionRequest(BaseModel):
    script: str
    params: Dict[str, Any]

@app.post("/api/python/execute")
async def execute_python_script(request: ScriptExecutionRequest):
    try:
        print("Exécution du script avec les paramètres:", request.params)
        print("Contenu du script reçu:", request.script)
        
        # Créer un fichier temporaire pour le script
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
            # Ajouter uniquement les imports nécessaires
            setup_code = """# -*- coding: utf-8 -*-
import os
import sys
import logging
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import json

# Configuration du logging
logging.basicConfig(level=logging.INFO)

# Charger les variables d'environnement
load_dotenv()

# Configuration de Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Variables d'environnement Supabase manquantes")

# Vérifier la connexion à Supabase
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
try:
    # Tester la connexion en récupérant une ligne de la table stock_to_dispatch
    test = supabase.table('stock_to_dispatch').select('id').limit(1).execute()
    logging.info("Connexion à Supabase réussie")
except Exception as e:
    logging.error(f"Erreur de connexion à Supabase: {str(e)}")
    raise

# Récupérer l'ID du dispatch depuis les arguments
if len(sys.argv) < 2:
    raise ValueError("L'ID du stock_to_dispatch est requis")

stock_to_dispatch_id = sys.argv[1]
"""
            f.write(setup_code)
            f.write("\n")
            # Encoder le script en UTF-8 avant de l'écrire
            encoded_script = request.script.encode('utf-8').decode('utf-8')
            f.write(encoded_script)
            f.write("\n\n# Exécuter la fonction principale et imprimer le résultat\nresult = calculate_distribution(stock_to_dispatch_id)\nprint(json.dumps(result))")
            script_path = f.name
        
        try:
            # Exécuter le script Python avec le même environnement virtuel que le serveur
            python_executable = sys.executable
            result = subprocess.run(
                [python_executable, script_path, request.params['stock_to_dispatch_id']],
                capture_output=True,
                text=True,
                encoding='utf-8',
                errors='replace'  # Gérer les erreurs d'encodage en remplaçant les caractères invalides
            )
            
            if result.returncode != 0:
                print("Erreur lors de l'exécution du script:", result.stderr)
                raise HTTPException(status_code=500, detail=result.stderr)
            
            print("Sortie du script:", result.stdout)
            
            # Essayer de parser le résultat JSON
            try:
                script_result = json.loads(result.stdout.strip().split('\n')[-1])
                return {
                    "success": script_result.get("success", True),
                    "message": script_result.get("message", "Script exécuté avec succès"),
                    "distribution_id": script_result.get("distribution_id"),
                    "items_count": script_result.get("items_count", 0)
                }
            except json.JSONDecodeError:
                return {
                    "success": True,
                    "message": "Script exécuté mais résultat non parsable",
                    "output": result.stdout
                }
        finally:
            # Nettoyer le fichier temporaire
            os.unlink(script_path)
            
    except Exception as e:
        print("Erreur lors de l'exécution du script:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 