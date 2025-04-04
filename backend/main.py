from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from dotenv import load_dotenv
import httpx
import io
import json

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 