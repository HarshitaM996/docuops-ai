from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import documents, chat
from app.config import settings

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Secure multi-tenant B2B compliance document processing and similarity vector assistant."
)

# CORS Configuration
# Allow local Next.js dashboard client to query backend APIs directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(documents.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.API_VERSION
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
