from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.rag_service import search_similarity
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class QueryRequest(BaseModel):
    query: str

@router.post("/query")
def query_compliance_assistant(
    request: QueryRequest,
    x_tenant_id: str = Header(..., alias="X-Tenant-ID"),
    db: Session = Depends(get_db)
):
    """
    Audit vector similarity search against active document chunks.
    Since db is configured with active tenant ID context, pgvector search runs 
    completely isolated per tenant at the database engine level.
    """
    try:
        # Run cosine similarity search (ordering by <=>)
        # Limit matches to top 3
        chunks = search_similarity(db, request.query, limit=3)
        return {
            "query": request.query,
            "tenant_id": x_tenant_id,
            "matches": chunks
        }
    except Exception as e:
        logger.error(f"Similarity search error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Compliance query failure: {str(e)}"
        )
