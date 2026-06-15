# B2B Multi-Tenant RLS Database Execution Pattern

To enforce Row-Level Security (RLS) policies at the database layer during vector similarity queries, the repository layer must set the local session variable `app.current_tenant_id` before executing queries.

## Python (SQLAlchemy) Execution Pattern

Implement the following flow inside the repository layer:

```python
# Before running the vector similarity query, set the session variable
db.execute(
    text("SET LOCAL app.current_tenant_id = :tenant_id"), 
    {"tenant_id": current_tenant_id}
)

# Run the standard similarity query safely isolated by the database RLS layer
results = db.execute(
    text("SELECT text_content FROM document_chunks ORDER BY embedding <=> :query_vector LIMIT 5"),
    {"query_vector": query_vector}
).fetchall()
```

### Key Technical Details
1. **`SET LOCAL` scope:** Using `SET LOCAL` guarantees that the variable is only applied within the boundaries of the active transaction. Once the transaction is committed or rolled back, the variable is cleared, preventing session leakage when using connection pooling.
2. **`<=>` Operator:** Denotes the cosine distance operator in `pgvector`.
3. **Automatic RLS filtering:** Setting `app.current_tenant_id` triggers the database policy:
   ```sql
   CREATE POLICY tenant_isolation_policy ON document_chunks 
       USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
   ```
   This ensures that the vector similarity search is restricted strictly to chunks belonging to that specific tenant, preventing any cross-tenant data visibility.
