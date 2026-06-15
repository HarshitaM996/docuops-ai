# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import text
import uuid
import time
import logging

logger = logging.getLogger(__name__)

def chunk_text(content: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits text into chunks of chunk_size characters with a sliding window overlap.
    """
    chunks = []
    if not content:
        return chunks
        
    start = 0
    content_len = len(content)
    
    while start < content_len:
        end = min(start + chunk_size, content_len)
        chunks.append(content[start:end])
        # Move forward by chunk_size - overlap
        start += chunk_size - overlap
        if start >= content_len or (chunk_size - overlap) <= 0:
            break
            
    return chunks

def process_document_in_background(db: Session, tenant_id: str, document_id: str, file_content: bytes, filename: str):
    """
    Background worker that decodes content, splits it into chunks,
    generates 1536-dimensional mock embeddings, and stores them in the database.
    """
    try:
        # Decode bytes to text
        text_content = file_content.decode("utf-8", errors="ignore")
        if not text_content:
            text_content = f"Empty document content placeholder for {filename}"
            
        # Split text into chunks
        text_chunks = chunk_text(text_content, chunk_size=500, overlap=50)
        
        logger.info(f"Processing document {document_id} for tenant {tenant_id}. Generated {len(text_chunks)} chunks.")
        
        # Insert each chunk with a 1536-dimensional vector
        for idx, chunk in enumerate(text_chunks):
            # Generate a 1536-dimensional dummy embedding (e.g. floats centered around index value)
            # OpenAI/LLM embeddings are 1536 floats. We populate it with a small non-zero float.
            mock_val = (idx + 1) * 0.001
            mock_embedding = [mock_val] * 1536
            
            # Format vector as PG pgvector string representation: '[0.001, 0.001, ...]'
            embedding_str = f"[{','.join(map(str, mock_embedding))}]"
            
            # Insert chunk via raw SQL to bypass SQLAlchemy type limitations
            db.execute(
                text("""
                    INSERT INTO document_chunks (id, document_id, tenant_id, text_content, embedding)
                    VALUES (gen_random_uuid(), :doc_id, :tenant_id, :content, CAST(:embedding AS vector))
                """),
                {
                    "doc_id": document_id,
                    "tenant_id": tenant_id,
                    "content": chunk,
                    "embedding": embedding_str
                }
            )
            
        # Update document status to indexed
        db.execute(
            text("UPDATE documents SET status = 'indexed' WHERE id = :doc_id AND tenant_id = :tenant_id"),
            {"doc_id": document_id, "tenant_id": tenant_id}
        )
        # Commit the transaction changes
        db.commit()
        logger.info(f"Successfully processed and indexed document {document_id}")
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error processing document {document_id}: {str(e)}")
        # Update document status to failed
        try:
            db.execute(
                text("UPDATE documents SET status = 'failed' WHERE id = :doc_id"),
                {"doc_id": document_id}
            )
            db.commit()
        except Exception as db_err:
            logger.error(f"Could not update document status to failed: {str(db_err)}")


def search_similarity(db: Session, query: str, limit: int = 3) -> list[dict]:
    """
    Executes a pgvector similarity search using the <=> cosine operator.
    Since RLS is active on the session, it only returns records belonging to the current tenant.
    """
    # Create a dummy 1536-dimensional query vector matching standard format
    # In production, this would be fetched from OpenAI Embeddings API (e.g., text-embedding-3-small)
    dummy_query_vector = [0.001] * 1536
    query_vector_str = f"[{','.join(map(str, dummy_query_vector))}]"
    
    # Query using cosine similarity ordering operator (<=>)
    # RLS enforces that this query ONLY sees chunks matching the session's app.current_tenant_id
    query_sql = text("""
        SELECT id, document_id, text_content, (embedding <=> CAST(:query_vector AS vector)) as distance
        FROM document_chunks
        ORDER BY embedding <=> CAST(:query_vector AS vector)
        LIMIT :limit
    """)
    
    results = db.execute(
        query_sql,
        {"query_vector": query_vector_str, "limit": limit}
    ).fetchall()
    
    return [
        {
            "chunk_id": str(row[0]),
            "document_id": str(row[1]),
            "text_content": row[2],
            "distance": float(row[3])
        }
        for row in results
    ]
