from __future__ import annotations

import os
from contextlib import contextmanager
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

# Carrega .env da pasta python-backend (e da raiz do projeto, se existir)
try:
    from dotenv import load_dotenv
    BASE_DIR = Path(__file__).resolve().parent
    load_dotenv(BASE_DIR / ".env")
    load_dotenv(BASE_DIR.parent / ".env")
except ImportError:
    pass

# Configuração do Postgres (variáveis de ambiente ou padrões do docker-compose)
PG_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": int(os.environ.get("PGPORT", "5432")),
    "dbname": os.environ.get("PGDATABASE", "olimpika"),
    "user": os.environ.get("PGUSER", "olimpika_user"),
    "password": os.environ.get("PGPASSWORD", "olimpika_pass"),
}


USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('aluno', 'personal', 'admin')),
    created_at TEXT
);
"""


class SQLiteStyleCursor(RealDictCursor):
    """
    Cursor psycopg2 que aceita sintaxe de placeholder do SQLite ("?")
    convertendo para o formato do Postgres ("%s").
    """

    def execute(self, query, params=None):
        query = query.replace("?", "%s")
        super().execute(query, params)
        return self

    def executemany(self, query, vars_list):
        query = query.replace("?", "%s")
        super().executemany(query, vars_list)
        return self


def init_db() -> None:
    """
    Garante a existência da tabela users no Postgres.
    As demais tabelas (students, workouts, exercises, workout_sessions)
    já são criadas via migração/seed.
    """
    conn = psycopg2.connect(cursor_factory=SQLiteStyleCursor, **PG_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(USERS_TABLE_SQL)
    finally:
        conn.close()


def get_connection():
    """
    Retorna uma nova conexão com Postgres usando o cursor compatível
    com a sintaxe de placeholders usada no código atual.
    """
    return psycopg2.connect(cursor_factory=SQLiteStyleCursor, **PG_CONFIG)


@contextmanager
def with_connection():
    """Context manager que garante fechamento da conexão."""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


# O schema (tabelas) é criado pelo migration.py. A API usa with_connection() ao receber requests.

