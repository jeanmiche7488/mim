import uvicorn
from dotenv import load_dotenv
import os

# Chargement des variables d'environnement
load_dotenv()

if __name__ == "__main__":
    uvicorn.run(
        "src.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    ) 