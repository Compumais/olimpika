# Olimpika

App web (Vite + React) + API Python (FastAPI + PostgreSQL).

## Pré-requisitos

- Node.js 18+
- Python 3.10+
- PostgreSQL (local ou hospedado, ex.: Render)

## Frontend

```bash
npm install
```

Crie `.env.local` na raiz do projeto:

```
VITE_API_BASE_URL=http://localhost:4000
```

```bash
npm run dev
```

## Backend (python-backend)

```bash
cd python-backend
pip install -r requirements.txt
```

Configure `.env` em `python-backend/` com `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

```bash
python migration.py
python seed.py
uvicorn main:app --host 0.0.0.0 --port 4000
```

## Build de produção

```bash
npm run build
npm run preview
```
