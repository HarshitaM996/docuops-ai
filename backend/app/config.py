import os

class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://docuops_user:password123@localhost:5432/docuops_db"
    )
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "mock-openai-key")
    PROJECT_NAME: str = "DocuOps AI Backend"
    API_VERSION: str = "v1"

settings = Settings()
