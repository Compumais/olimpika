"""
Migra os dados do SQLite (academia.db) para o Postgres do docker-compose.

Pré‑requisitos:
- Docker com o serviço postgres do docker-compose rodando:
    docker compose up -d postgres
- Dependências Python instaladas no backend:
    pip install -r requirements.txt

Uso:
    cd python-backend
    python migrate_sqlite_to_postgres.py
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Dict, List

import psycopg2
from psycopg2.extras import execute_batch


BASE_DIR = Path(__file__).resolve().parent
SQLITE_PATH = BASE_DIR / "data" / "academia.db"

# Mesmos dados do docker-compose.yml
PG_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "olimpika",
    "user": "olimpika_user",
    "password": "olimpika_pass",
}


def quote_ident(name: str) -> str:
    """Cota identificadores (tabelas/colunas) para Postgres, incluindo 'order'."""
    return '"' + name.replace('"', '""') + '"'


def connect_sqlite() -> sqlite3.Connection:
    if not SQLITE_PATH.exists():
        raise FileNotFoundError(f"SQLite não encontrado em: {SQLITE_PATH}")
    conn = sqlite3.connect(SQLITE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def connect_postgres():
    conn = psycopg2.connect(**PG_CONFIG)
    # Durante a migração, desabilita validação de FKs/uniques/triggers
    # para permitir copiar dados mesmo se o SQLite tiver referências quebradas
    with conn.cursor() as cur:
        cur.execute("SET session_replication_role = 'replica';")
    conn.commit()
    return conn


def create_postgres_schema(pg_conn) -> None:
    """Cria apenas as tabelas e índices principais em Postgres (sem views)."""
    ddl_statements: List[str] = [
        # students
        """
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            personal_trainer_email TEXT,
            goal TEXT,
            notes TEXT,
            created_date TEXT,
            updated_date TEXT,
            created_by_id TEXT,
            created_by TEXT,
            is_sample BOOLEAN DEFAULT false
        );
        """,
        # workouts
        """
        CREATE TABLE IF NOT EXISTS workouts (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            short_name TEXT,
            description TEXT,
            muscle_groups TEXT,
            estimated_duration TEXT,
            color TEXT,
            student_id TEXT,
            created_date TEXT,
            updated_date TEXT,
            created_by_id TEXT,
            created_by TEXT,
            is_sample BOOLEAN DEFAULT false,
            CONSTRAINT fk_workouts_student
              FOREIGN KEY (student_id) REFERENCES students(id)
        );
        """,
        # exercises
        """
        CREATE TABLE IF NOT EXISTS exercises (
            id TEXT PRIMARY KEY,
            workout_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            video_url TEXT,
            sets TEXT,
            reps TEXT,
            weight TEXT,
            rest_seconds TEXT,
            "order" TEXT,
            is_template BOOLEAN DEFAULT false,
            muscle_group TEXT,
            created_date TEXT,
            updated_date TEXT,
            created_by_id TEXT,
            created_by TEXT,
            is_sample BOOLEAN DEFAULT false,
            CONSTRAINT fk_exercises_workout
              FOREIGN KEY (workout_id) REFERENCES workouts(id)
        );
        """,
        # workout_sessions
        """
        CREATE TABLE IF NOT EXISTS workout_sessions (
            id TEXT PRIMARY KEY,
            user_email TEXT NOT NULL,
            workout_id TEXT,
            workout_name TEXT,
            date TEXT NOT NULL,
            start_time TEXT,
            end_time TEXT,
            duration_minutes TEXT,
            status TEXT,
            exercises_completed TEXT,
            created_date TEXT,
            updated_date TEXT,
            created_by_id TEXT,
            created_by TEXT,
            is_sample BOOLEAN DEFAULT false
        );
        """,
        # users (tabela de auth do backend)
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            user_type TEXT NOT NULL,
            created_at TEXT
        );
        """,
        # índices
        'CREATE INDEX IF NOT EXISTS idx_workouts_student_id ON workouts(student_id);',
        'CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);',
        'CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_email ON workout_sessions(user_email);',
        'CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions(workout_id);',
        'CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);',
        'CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);',
    ]

    with pg_conn.cursor() as cur:
        for ddl in ddl_statements:
            cur.execute(ddl)
    pg_conn.commit()


def table_exists_sqlite(sqlite_conn: sqlite3.Connection, name: str) -> bool:
    cur = sqlite_conn.cursor()
    cur.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1",
        (name,),
    )
    return cur.fetchone() is not None


def fetch_all_rows(sqlite_conn: sqlite3.Connection, table: str) -> tuple[list[str], list[sqlite3.Row]]:
    cur = sqlite_conn.cursor()
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    columns = [d[0] for d in cur.description]
    return columns, rows


def normalize_row(table: str, columns: List[str], row: sqlite3.Row) -> List:
    """Converte valores de uma linha para tipos aceitáveis pelo Postgres."""
    data: List = []
    # Colunas BOOLEAN em nosso modelo
    bool_cols = {"is_sample", "is_template"}

    for col in columns:
        value = row[col]
        if col in bool_cols and value is not None:
            s = str(value).strip().lower()
            value = s in ("1", "true", "t", "yes")
        data.append(value)
    return data


def migrate_table(sqlite_conn: sqlite3.Connection, pg_conn, table: str) -> None:
    if not table_exists_sqlite(sqlite_conn, table):
        print(f"- Tabela {table} não existe no SQLite, pulando.")
        return

    columns, rows = fetch_all_rows(sqlite_conn, table)
    if not rows:
        print(f"- Tabela {table}: nenhuma linha para migrar.")
        return

    col_id = "id" if "id" in columns else None
    cols_sql = ", ".join(quote_ident(c) for c in columns)
    placeholders = ", ".join(["%s"] * len(columns))

    if col_id:
        conflict_clause = f"ON CONFLICT ({quote_ident(col_id)}) DO NOTHING"
    else:
        conflict_clause = ""

    insert_sql = f'INSERT INTO {quote_ident(table)} ({cols_sql}) VALUES ({placeholders}) {conflict_clause};'

    payload = [normalize_row(table, columns, r) for r in rows]

    with pg_conn.cursor() as cur:
        execute_batch(cur, insert_sql, payload, page_size=500)
    pg_conn.commit()

    print(f"- Tabela {table}: migradas {len(rows)} linha(s).")


def main() -> None:
    print(f"Usando SQLite em: {SQLITE_PATH}")
    sqlite_conn = connect_sqlite()
    pg_conn = connect_postgres()

    try:
        print("Criando esquema no Postgres (se necessário)...")
        create_postgres_schema(pg_conn)

        for table in ["students", "workouts", "exercises", "workout_sessions", "users"]:
            migrate_table(sqlite_conn, pg_conn, table)

        print("Migração concluída com sucesso.")
    finally:
        try:
            # Restaura o comportamento normal de constraints
            with pg_conn.cursor() as cur:
                cur.execute("SET session_replication_role = 'origin';")
            pg_conn.commit()
        except Exception:
            pass
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    main()

