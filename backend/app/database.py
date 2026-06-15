import contextlib
from sqlalchemy import create_engine, Column, String, ForeignKey, DateTime, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Header, HTTPException
from app.config import settings
import datetime

# Setup SQLAlchemy database engine
# Aurora PostgreSQL/Postgres engine setup
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ----------------------------------------------------------------------------
# SQLAlchemy ORM Models (Matching Postgres init_schema.sql)
# ----------------------------------------------------------------------------

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, nullable=False)

class Document(Base):
    __tablename__ = "documents"
    __tablename__ = "documents"
    id = Column(String, primary_key=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    status = Column(String, nullable=False, default="processing")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    id = Column(String, primary_key=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    text_content = Column(Text, nullable=False)
    # embedding column is handled via raw SQL vectors to bypass pgvector dependency in SQLAlchemy typing

# ----------------------------------------------------------------------------
# Database Session Dependencies with Row-Level Security (RLS)
# ----------------------------------------------------------------------------

@contextlib.contextmanager
def get_db_context(tenant_id: str):
    """
    Context manager for repository layer / background tasks.
    Crucially executes SET LOCAL app.current_tenant_id = :tenant_id inside transaction
    to enforce Postgres Row-Level Security (RLS).
    """
    db = SessionLocal()
    # Start a transaction block explicitly
    db.begin()
    try:
        # Enforce RLS session variable
        db.execute(
            text("SET LOCAL app.current_tenant_id = :tenant_id"),
            {"tenant_id": tenant_id}
        )
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def get_db(x_tenant_id: str = Header(..., alias="X-Tenant-ID")):
    """
    FastAPI Route dependency. Extracts X-Tenant-ID from request headers,
    initializes session, sets the transaction-local app.current_tenant_id variable
    to enforce RLS, and yields the session.
    """
    db = SessionLocal()
    # Start a transaction block explicitly
    db.begin()
    try:
        # Enforce RLS session variable
        db.execute(
            text("SET LOCAL app.current_tenant_id = :tenant_id"),
            {"tenant_id": x_tenant_id}
        )
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=f"Database transaction error: {str(e)}"
        )
    finally:
        db.close()
