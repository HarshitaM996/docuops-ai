from fastapi import APIRouter, Depends, UploadFile, File, Header, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db, get_db_context
from app.services.rag_service import process_document_in_background
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/documents",
    tags=["documents"]
)

def background_processing_wrapper(tenant_id: str, document_id: str, file_content: bytes, filename: str):
    """
    Wrapper function executed by FastAPI BackgroundTasks.
    It creates an isolated session context, sets RLS variables, and executes indexing.
    """
    with get_db_context(tenant_id) as db:
        process_document_in_background(db, tenant_id, document_id, file_content, filename)

@router.post("/upload", status_code=202)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_tenant_id: str = Header(..., alias="X-Tenant-ID"),
    db: Session = Depends(get_db)
):
    """
    Upload a legal document, save metadata to SQL, and queue background
    text chunking and vector embedding mapping.
    """
    try:
        # Read file contents in memory
        content_bytes = await file.read()
        size_bytes = len(content_bytes)
        document_id = str(uuid.uuid4())
        
        # Save document metadata. Note that because get_db runs SET LOCAL app.current_tenant_id,
        # the database validates that this insertion complies with RLS.
        db.execute(
            text("""
                INSERT INTO documents (id, tenant_id, filename, status)
                VALUES (:doc_id, :tenant_id, :filename, 'processing')
            """),
            {
                "doc_id": document_id,
                "tenant_id": x_tenant_id,
                "filename": file.filename
            }
        )
        # Commit metadata insertion
        db.commit()
        
        # Add background task to split and index chunks
        background_tasks.add_task(
            background_processing_wrapper,
            x_tenant_id,
            document_id,
            content_bytes,
            file.filename
        )
        
        return {
            "message": "Document uploaded and queued for processing.",
            "document_id": document_id,
            "filename": file.filename,
            "status": "processing"
        }
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest file: {str(e)}"
        )
