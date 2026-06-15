# DocuOps AI

An AI-powered, multi-tenant B2B compliance document checking and similarity vector search platform utilizing FastAPI, Next.js (App Router), and PostgreSQL (`pgvector`).

---

## Project Architecture & Directory Layout

The repository is structured into separate `/frontend` and `/backend` directories for clean dependency separation. 

```
docuops-ai/
├── backend/                 # FastAPI backend application
│   ├── .venv/               # Self-contained Python virtual environment
│   ├── app/                 # FastAPI routes, models, and services
│   ├── requirements.txt     # Python requirements
│   └── test_doc.txt         # Test document sample
├── frontend/                # Next.js frontend application
│   ├── public/              # Public assets
│   ├── src/                 # App Router pages and custom components
│   ├── package.json         # NPM package dependencies
│   └── tsconfig.json        # TypeScript configuration
├── db/                      # Database scripts and migrations
│   └── migrations/
│       └── 0001_init_schema.sql  # Reference migration script
├── docker-compose.yml       # Local PostgreSQL database orchestrator (pgvector)
├── init_schema.sql          # Working database schema used by backend
└── README.md                # General documentation (this file)
```

---

## Core Infrastructure & Setup

### 1. Database (Docker Compose)
* **Location:** Keep `docker-compose.yml` at the **root** of the repository. Placing it here makes it easy to orchestrate all services from a single project-level file.
* **Database Image:** `pgvector/pgvector:pg16` (PostgreSQL 16 with pgvector extension)

To start the database container:
```bash
# Start the Postgres container in background
docker compose up -d
```

---

### 2. Database Schema Configuration

You will find two schema files in this project:
1. **`init_schema.sql` (Root)** — **Working Schema**
   * *Purpose:* This is the active schema used by our FastAPI backend. The FastAPI models (`backend/app/database.py`) and routers map exactly to this file (e.g. using `filename` fields and omitting `chunk_index` requirements).
2. **`db/migrations/0001_init_schema.sql`** — **Reference Schema**
   * *Purpose:* An expanded schema containing production features such as secure user password hashing, tenant slugs, triggers, and document file sizes. This is kept as a reference for database administration and future feature expansions.

To run the working schema against the Docker database:
```bash
docker exec -i docuops-postgres psql -U postgres -d docuops_db < init_schema.sql
```

---

### 3. Backend Setup & Run

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment (if not already done):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   ./.venv/bin/uvicorn app.main:app --reload --port 8001
   ```
   * Access the API docs (Swagger UI) at [http://localhost:8001/docs](http://localhost:8001/docs).

---

### 4. Frontend Setup & Run

1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   * Access the web dashboard at [http://localhost:3000](http://localhost:3000).
