"""
Limpa todas as informações de dados do Postgres usadas pelo app.

ATENÇÃO: isto apaga TODO o conteúdo das tabelas:
- workout_sessions
- exercises
- workouts
- students
- users

O schema (tabelas) permanece, apenas os registros são removidos.

Pré‑requisitos:
- Serviço Postgres do docker-compose rodando:
    docker compose up -d postgres
- Dependências Python instaladas:
    pip install -r requirements.txt

Uso:
    cd python-backend
    python clear_postgres_data.py
"""

from __future__ import annotations

import os
from typing import List, Tuple

import psycopg2
from psycopg2.extras import RealDictCursor


PG_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": int(os.environ.get("PGPORT", "5432")),
    "dbname": os.environ.get("PGDATABASE", "olimpika"),
    "user": os.environ.get("PGUSER", "olimpika_user"),
    "password": os.environ.get("PGPASSWORD", "olimpika_pass"),
}


def get_counts(cur, tables: List[str]) -> List[Tuple[str, int]]:
    results: List[Tuple[str, int]] = []
    for t in tables:
        cur.execute(f"SELECT COUNT(*) AS n FROM {t}")
        row = cur.fetchone()
        results.append((t, row["n"] if isinstance(row, dict) else row[0]))
    return results


def main() -> None:
    tables = ["workout_sessions", "exercises", "workouts", "students", "users"]

    conn = psycopg2.connect(cursor_factory=RealDictCursor, **PG_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                before = get_counts(cur, tables)
                print("Registros antes da limpeza:")
                for name, n in before:
                    print(f"- {name}: {n}")

                # Evita problemas de FK durante a limpeza
                cur.execute("SET session_replication_role = 'replica';")
                cur.execute(
                    "TRUNCATE TABLE workout_sessions, exercises, workouts, students, users RESTART IDENTITY CASCADE;"
                )
                cur.execute("SET session_replication_role = 'origin';")

                after = get_counts(cur, tables)
                print("\nRegistros após a limpeza:")
                for name, n in after:
                    print(f"- {name}: {n}")

    finally:
        conn.close()


if __name__ == "__main__":
    main()

