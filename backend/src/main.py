from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.auth import router as auth_router
from .routes.stocks import router as stocks_router
from .routes.distribution import router as distribution_router
from .routes.stock_to_dispatch import router as stock_to_dispatch_router

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(stocks_router, prefix="/stocks", tags=["stocks"])
app.include_router(distribution_router, prefix="/distribution", tags=["distribution"])
app.include_router(stock_to_dispatch_router, prefix="/stock-to-dispatch", tags=["stock-to-dispatch"])

@app.get("/")
async def root():
    return {"message": "MIM API"} 