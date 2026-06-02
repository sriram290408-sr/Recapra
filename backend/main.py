import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routers.main_router import main_router
from config import UPLOAD_DIR

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Recapra API",
    description="Phase 1 backend for Recapra career rebuilding platform",
    version="1.0.0"
)

# CORS setup supporting dynamic frontend origins
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
cors_origins = os.getenv("CORS_ORIGINS")

if cors_origins:
    origins = [origin.strip() for origin in cors_origins.split(",") if origin.strip()]
else:
    origins = [
        frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ]

# Remove duplicates while keeping list format
origins = list(set(origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists before mounting
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include main router
app.include_router(main_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Recapra API is running"}
