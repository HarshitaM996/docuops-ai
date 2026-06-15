-- ============================================================================
-- DocuOps AI - Multi-Tenant Vector Database Schema Migration (PostgreSQL)
-- Targeted for: AWS Aurora PostgreSQL 15+ (pgvector 0.5.0+)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS & PREREQUISITES
-- ----------------------------------------------------------------------------

-- Initialize pgvector extension (for high-dimensional vector embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Initialize pgcrypto extension (for secure UUID generation)
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ----------------------------------------------------------------------------
-- 2. CORE DATABASE TABLES
-- ----------------------------------------------------------------------------

-- A. Tenants Table (Business boundaries)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- B. Users Table (Scoped strictly to a tenant)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- C. Documents Table (Relational document metadata)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'processing',
    fail_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure status values conform to pipeline states
    CONSTRAINT check_document_status CHECK (status IN ('processing', 'indexed', 'failed'))
);

-- D. Document Chunks Table (Text segments and vector embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    text_content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL, -- 1536 dims for standard OpenAI/LLM models
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_document_chunk_index UNIQUE (document_id, chunk_index)
);


-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR RELATIONAL PERFORMANCE & VECTOR SEARCH
-- ----------------------------------------------------------------------------

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant_doc ON document_chunks(tenant_id, document_id);

-- High-Performance pgvector HNSW Index on embedding.
-- Since pgvector access methods (HNSW/IVFFlat) do not support multi-column (composite) 
-- indexes, we build a single-column HNSW index on the vector field using Cosine Operator.
-- We specify m = 16 and ef_construction = 64 (standard for balanced speed/accuracy).
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);


-- ----------------------------------------------------------------------------
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION
-- ----------------------------------------------------------------------------

-- Enable RLS on all scoped tables to prevent cross-tenant data leaks
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- We extract tenant context from the session context 'app.current_tenant_id'
-- which is populated securely by the application database connector pool.

-- RLS Policy for Users
CREATE POLICY tenant_isolation_users ON users
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- RLS Policy for Documents
CREATE POLICY tenant_isolation_documents ON documents
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);

-- RLS Policy for Document Chunks
CREATE POLICY tenant_isolation_document_chunks ON document_chunks
    FOR ALL
    USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);


-- ----------------------------------------------------------------------------
-- 5. ALTERNATIVE: PARTITIONING-BY-TENANT LAYOUT (COPIABLE WORKAROUND)
-- ----------------------------------------------------------------------------
/*
   For extreme B2B scale, partitioning by tenant_id ensures that each tenant's HNSW 
   index is completely isolated in a dedicated table partition, boosting search recall.
   
   To use partitioning instead of a flat RLS table, run the following:

   -- Drop the flat table if it exists
   DROP TABLE IF EXISTS document_chunks;

   -- Create the partitioned table
   CREATE TABLE document_chunks (
       id UUID,
       document_id UUID NOT NULL,
       tenant_id UUID NOT NULL,
       chunk_index INTEGER NOT NULL,
       text_content TEXT NOT NULL,
       embedding VECTOR(1536) NOT NULL,
       created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id, tenant_id) -- Partition key must be part of the primary key
   ) PARTITION BY LIST (tenant_id);

   -- When a tenant is onboarded, the system runs:
   -- CREATE TABLE document_chunks_tenant_id PARTITION OF document_chunks FOR VALUES IN ('tenant-uuid-here');
   -- CREATE INDEX ON document_chunks_tenant_id USING hnsw (embedding vector_cosine_ops);
*/


-- ----------------------------------------------------------------------------
-- 6. AUTOMATED TEMPORAL METADATA TRIGGERS (UPDATED_AT)
-- ----------------------------------------------------------------------------

-- Trigger function to automatically update 'updated_at' columns on row change
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_tenants_modtime BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_documents_modtime BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_modified_column();
