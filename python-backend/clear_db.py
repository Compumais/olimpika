"""
Limpa todos os dados do banco PostgreSQL (Olimpika).

Apaga o conteúdo das tabelas:
- workout_sessions
- exercises
- workouts
- student_template_assignments
- template_exercises
- workout_templates
- students
- users
Opcionalmente reseta schema_migrations (para reaplicar migrações do zero).

Usa as variáveis de ambiente do db (PGHOST, PGPORT, etc. / .env).

Uso:
    cd python-backend
    python clear_db.py              # pede confirmação
    python clear_db.py --force       # sem confirmação
    python clear_db.py --reset-migrations   # também limpa schema_migrations
"""

from __future__ import annotations

import sys

import psycopg2
from db import get_connection

# Ordem respeitando FKs: tabelas que referenciam outras vêm primeiro
DATA_TABLES = [
    "workout_sessions",
    "exercises",
    "workouts",
    "student_template_assignments",
    "template_exercises",
    "workout_templates",
    "students",
    "users",
]


def get_counts(conn) -> list[tuple[str, int]]:
    cur = conn.cursor()
    result = []
    for table in DATA_TABLES:
        cur.execute(f'SELECT COUNT(*) AS n FROM "{table}"')
        row = cur.fetchone()
        n = row["n"] if hasattr(row, "keys") else row[0]
        result.append((table, n))
    return result


def clear_data(conn, reset_migrations: bool = False) -> None:
    with conn.cursor() as cur:
        # Desabilita checagem de FKs durante o TRUNCATE
        cur.execute("SET session_replication_role = 'replica';")

        tables = list(DATA_TABLES)
        if reset_migrations:
            tables.append("schema_migrations")

        # TRUNCATE na ordem: filhos antes dos pais (por causa das FKs)
        cur.execute(
            "TRUNCATE TABLE workout_sessions, exercises, workouts, student_template_assignments, template_exercises, workout_templates, students, users RESTART IDENTITY CASCADE"
        )
        if reset_migrations:
            cur.execute("TRUNCATE TABLE schema_migrations RESTART IDENTITY CASCADE")

        cur.execute("SET session_replication_role = 'origin';")
    conn.commit()


def main() -> None:
    reset_migrations = "--reset-migrations" in sys.argv
    force = "--force" in sys.argv or "-f" in sys.argv

    try:
        conn = get_connection()
    except psycopg2.Error as e:
        print(f"Erro ao conectar: {e}", file=sys.stderr)
        print("Verifique o .env (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).", file=sys.stderr)
        sys.exit(1)

    try:
        before = get_counts(conn)
        print("Registros atuais:")
        for name, n in before:
            print(f"  {name}: {n}")

        if not force:
            msg = "Apagar todos esses dados? (s/N) "
            if reset_migrations:
                msg = "Apagar todos os dados E o histórico de migrações? (s/N) "
            r = input(msg).strip().lower()
            if r not in ("s", "sim", "y", "yes"):
                print("Cancelado.")
                return

        clear_data(conn, reset_migrations=reset_migrations)
        after = get_counts(conn)

        print("\nLimpeza concluída. Registros agora:")
        for name, n in after:
            print(f"  {name}: {n}")
        if reset_migrations:
            print("  schema_migrations: 0 (resetado)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
