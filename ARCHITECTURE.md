# DocuOps AI - System Architecture

This document describes the high-level architecture, multi-tenant security layers, and vector-search details of the DocuOps AI platform.

---

## 1. System Request Lifecycle Flow

Below is an ASCII sequence flow diagram illustrating how a user query traverses the frontend, API gateway, and RLS-enforced database layer.

```
+------------------+             +-----------------+             +-------------------+             +---------------------+
| Next.js Frontend |             | FastAPI Backend |             | Database Session  |             | PostgreSQL Database |
| (Vercel Hosted)  |             |  (Gateway API)  |             | (SQLAlchemy/Pool) |             |  (Aurora pgvector)  |
+--------+---------+             +--------+--------+             +---------+---------+             +----------+----------+
         |                                |                                |                                  |
         |  POST /api/v1/chat/query       |                                |                                  |
         |  Headers:                      |                                |                                  |
         |    X-Tenant-ID: <UUID>         |                                |                                  |
         |  Body: { query: "..." }        |                                |                                  |
         +------------------------------->|                                |                                  |
         |                                |  Extract X-Tenant-ID           |                                  |
         |                                |  from request header           |                                  |
         |                                +----------------+               |                                  |
         |                                                 |               |                                  |
         |                                                 v               |                                  |
         |                                           Call get_db()         |                                  |
         |                                           Dependency            |                                  |
         |                                +------------------------------->|                                  |
         |                                |                                |  Start Transaction               |
         |                                |                                +----------------+                 |
         |                                |                                                 |                 |
         |                                |                                                 v                 |
         |                                |                                           SET LOCAL               |
         |                                |                                           app.current_tenant_id   |
         |                                |                                           = :tenant_id            |
         |                                |                                +--------------------------------->|
         |                                |                                |                                  |
         |                                |                                |  Execute similarity query        |
         |                                |                                |  "SELECT ...                     |
         |                                |                                |   ORDER BY embedding <=> ...     |
         |                                |                                |   LIMIT 3"                       |
         |                                |                                +--------------------------------->|
         |                                |                                |                                  |
         |                                |                                |  [Engine applies RLS policy:     |
         |                                |                                |   tenant_id =                    |
         |                                |                                |   app.current_tenant_id          |
         |                                |                                |   using HNSW & B-Tree indexes]   |
         |                                |                                |<---------------------------------+
         |                                |                                |  Return isolated chunks          |
         |                                |<-------------------------------+                                  |
         |                                |  Commit & Close Session        |                                  |
         |                                +----------------+               |                                  |
         |                                                 |               |                                  |
         |                                                 v               |                                  |
         |                                           Process results       |                                  |
         |                                           & return JSON         |                                  |
         |<----------------------------------------+                                                          |
         |  HTTP 200 OK                                                                                       |
         |  Matches: [ ... ]                                                                                  |
         |                                                                                                    |
```

---

## 2. Component Design & Responsibilities

### A. Next.js Frontend (Vercel)
* **Design & Styling:** Custom CSS alongside Tailwind CSS and `shadcn/ui` components to support compliance-heavy B2B interfaces.
* **Tenant Selection Context:** Provides a global tenant-switching layout.
* **HTTP Headers:** Injects the active tenant ID into the `X-Tenant-ID` header of all outgoing fetch requests.
* **Interactive Chat & PDF View:** Interactive split-screen layout for running compliance queries against selected documents.

### B. FastAPI Backend (Gateway Service)
* **Application Gateway:** Routes queries and document uploads, verifying presence of the `X-Tenant-ID` header in path requests.
* **Dependency Injection Layer:** `get_db()` automatically configures transaction-local variables on the connection pool before returning a session.
* **Background Tasks:** Processes text chunking (500-char window, 50-char overlap) and generates 1536-dimensional embeddings asynchronously.

### C. AWS Aurora PostgreSQL (Database Layer)
* **Multi-Tenant Row-Level Security (RLS):** Prevents cross-tenant leaks at the database engine level.
* **Non-Superuser Access:** Connects using the limited privilege role `docuops_user` to ensure RLS is strictly enforced (as the `postgres` superuser bypasses RLS).
* **Vector Indexing (`pgvector`):** Speeds up cosine distance vector matching using an HNSW index.

---

## 3. Row-Level Security (RLS) & Vector Indexing Strategy

### The pgvector Composite Index Limitation
In typical relational databases, you isolate multi-tenant queries by placing a composite index on `(tenant_id, search_column)`. However, `pgvector` index formats (like **HNSW**) do not support multi-column indexes. 

To bypass this constraint, the platform implements **Pattern A: Relational Isolation with RLS**:

1. **Table Schema Configuration:**
   ```sql
   ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
   ```
2. **Policy Configuration:**
   ```sql
   CREATE POLICY tenant_isolation_document_chunks ON document_chunks
       FOR ALL
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID);
   ```
3. **Indexing Layout:**
   * **Vector Search:** A single-column **HNSW index** on the `embedding` column for ultra-fast distance scans.
   * **Relational Filter:** A standard **B-Tree index** on the `tenant_id` column to quickly restrict rows.

### Alternative Scale Pattern: List Partitioning (Pattern B)
For high-scale enterprise instances, the database schema supports declarative **List Partitioning by Tenant**. In this configuration, each tenant has a dedicated partition table with its own local HNSW index. This ensures perfect vector search recall and eliminates the performance overhead of executing large-scale distance queries across mixed-tenant datasets.
