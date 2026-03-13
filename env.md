# Variáveis de ambiente do projeto Olimpika

Este documento lista os arquivos que utilizam variáveis de ambiente e o nome de cada variável.

---

## src/api/localApiClient.js

| Variável | Descrição |
|----------|-----------|
| `VITE_API_BASE_URL` | URL base da API (padrão: http://localhost:4000) |

---

## python-backend/db.py

| Variável | Descrição |
|----------|-----------|
| `PGHOST` | Host do PostgreSQL |
| `PGPORT` | Porta do PostgreSQL (padrão: 5432) |
| `PGDATABASE` | Nome do banco |
| `PGUSER` | Usuário do PostgreSQL |
| `PGPASSWORD` | Senha do PostgreSQL |

(O mesmo conjunto é usado em `migration.py`, `seed.py`, `clear_db.py` e scripts que importam `db`.)

---

## docker-compose.yml

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_DB` | Nome do banco |
| `POSTGRES_USER` | Usuário |
| `POSTGRES_PASSWORD` | Senha |

---

## backend/index.js (Node, se usado)

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta do servidor (padrão: 4000) |

---

## Resumo

| Variável | Uso |
|----------|-----|
| `VITE_API_BASE_URL` | Frontend → API |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` | Backend Python → Postgres |

Crie `.env.local` na raiz (frontend) e `.env` em `python-backend/` conforme o ambiente.
