-- ============================================================================
-- DocuOps AI - Multi-Tenant Vector Database Schema
-- Architecture: Secure B2B Isolation (bypassing pgvector composite index limit)
-- Targeted for: AWS Aurora PostgreSQL 15+ (pgvector 0.5.0+)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & PREREQUISITES
-- ----------------------------------------------------------------------------

-- Initialize pgvector extension (for high-dimensional vector embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Initialize pgcrypto extension (for UUID generation if needed, default gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ----------------------------------------------------------------------------
-- 2. CORE DATABASE TABLES
-- ----------------------------------------------------------------------------

-- A. Tenants Table (Manage enterprise accounts)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B. Users Table (Linked to a specific tenant)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- C. Documents Table (Relational document metadata)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing',
    CONSTRAINT check_document_status CHECK (status IN ('processing', 'indexed', 'failed'))
);


-- ----------------------------------------------------------------------------
-- 3. PATTERN A: RELATIONAL ISOLATION WITH ROW-LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

-- Base table for document chunks
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    text_content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL -- 1536 dimensions for standard OpenAI/LLM embeddings
);

-- Single-column HNSW index on embedding column using vector_cosine_ops
-- (Resolves pgvector composite index constraint)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Standard B-tree index on the tenant_id column for fast relational filtering
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant_id
ON document_chunks (tenant_id);

-- Enable RLS on document_chunks table
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Create an RLS policy restricting row access based on session configuration variable 'app.current_tenant_id'
CREATE POLICY tenant_isolation_policy ON document_chunks
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ----------------------------------------------------------------------------
-- 4. ADDITIONAL SECURITY ENFORCEMENT ON CORE TABLES
-- ----------------------------------------------------------------------------

-- Enable RLS on users and documents tables to prevent cross-tenant leaks
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON users
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY tenant_isolation_documents ON documents
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);


-- ----------------------------------------------------------------------------
-- 5. PATTERN B: PHYSICAL PARTITIONING (COMMENTED TEMPLATE)
-- ----------------------------------------------------------------------------
/*
   For extreme-scale multi-tenant installations, PostgreSQL declarative list partitioning
   separates each tenant's chunks into independent partition tables. This isolates HNSW graphs
   physically, improving similarity search recall and speed.

   -- Step 1: Create the partitioned table
   CREATE TABLE document_chunks_partitioned (
       id UUID NOT NULL,
       document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
       tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
       text_content TEXT NOT NULL,
       embedding VECTOR(1536) NOT NULL,
       PRIMARY KEY (id, tenant_id) -- Partition key must be part of primary key
   ) PARTITION BY LIST (tenant_id);

   -- Step 2: Create a partition table for a specific tenant (e.g., tenant_001)
   -- Replace 'e1c9447e-8c34-4b55-87a3-cb2066c05d76' with actual tenant UUID.
   CREATE TABLE document_chunks_tenant_001 
   PARTITION OF document_chunks_partitioned 
   FOR VALUES IN ('e1c9447e-8c34-4b55-87a3-cb2066c05d76');

   -- Step 3: Create localized single-column HNSW index on the tenant partition
   CREATE INDEX idx_document_chunks_tenant_001_embedding 
   ON document_chunks_tenant_001 
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64);
*/

-- ----------------------------------------------------------------------------
-- 6. APPLICATION ROLE SETUP (Mandatory to enforce Row-Level Security)
-- ----------------------------------------------------------------------------

-- Create non-superuser role to connect from the FastAPI application.
-- Postgres superusers (e.g. 'postgres') bypass RLS policies even with FORCE RLS enabled.
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'docuops_user') THEN
        CREATE ROLE docuops_user WITH LOGIN PASSWORD 'password123';
    END IF;
END
$$;

-- Grant permissions to the RLS app user on the public schema tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO docuops_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO docuops_user;
