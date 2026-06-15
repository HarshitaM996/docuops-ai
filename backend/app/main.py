from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from app.routers import documents, chat
from app.config import settings
import logging

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.API_VERSION,
    description="Secure multi-tenant B2B compliance document processing and similarity vector assistant."
)

# CORS Configuration
if settings.ENVIRONMENT == "production":
    # Restrict allowed origins strictly to the configured Vercel domain list
    origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(",") if origin.strip()]
    logger.info(f"FastAPI running in production mode. Restricting CORS origins to: {origins}")
else:
    # Allow wildcard * in development
    origins = ["*"]
    logger.info("FastAPI running in development mode. Allowing wildcard '*' CORS origins.")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------------------------------
# Global Exception Handlers (Hardened Error & Logging Policies)
# ----------------------------------------------------------------------------

@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """
    Catch any relational database operational/connection errors or timeouts.
    Logs the detailed trace internally and returns a sanitized response to prevent information disclosure.
    """
    logger.error(f"Production database exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Database Error",
            "message": "A temporary database connection issue occurred. Please retry shortly."
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Ensures standard HTTP client errors (e.g. 404, 401, 400) bypass standard traceback logging.
    """
    logger.warning(f"HTTP client error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "Client Error",
            "message": exc.detail
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles payload schema mismatch validation failures cleanly.
    """
    logger.warning(f"Payload validation error: {str(exc.errors())}")
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all generic error handler. Logs unexpected tracebacks and returns sanitized enterprise payloads.
    """
    logger.error(f"Unhandled system error encountered: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. If this problem persists, please contact the administrator."
        }
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

