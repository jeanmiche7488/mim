from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import stocks, dispatch, stores

app = FastAPI(
    title="API de Dispatch de Stock",
    description="API pour la gestion et le dispatch de stock",
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(stocks.router)
app.include_router(dispatch.router)
app.include_router(stores.router)

@app.get("/")
async def root():
    return {"message": "Bienvenue sur l'API de Dispatch de Stock"} 