"""
Runner de migrações do banco PostgreSQL (Olimpika).

Cria a tabela schema_migrations e aplica migrações pendentes em ordem.
Usa as variáveis de ambiente do db (PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD).

Uso:
    cd python-backend
    python migration.py

Para apenas ver o status:
    python migration.py --status
"""
from __future__ import annotations

import sys
from datetime import datetime, timezone
from typing import List, Tuple

import psycopg2
from db import get_connection

# Tabela que controla quais migrações já foram aplicadas
MIGRATIONS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

# Migrações em ordem: (version, name, [lista de SQL])
MIGRATIONS: List[Tuple[str, str, List[str]]] = [
    (
        "001",
        "initial_schema",
        [
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
            # users (auth)
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                user_type TEXT NOT NULL CHECK(user_type IN ('aluno', 'personal')),
                created_at TEXT
            );
            """,
            # índices
            "CREATE INDEX IF NOT EXISTS idx_workouts_student_id ON workouts(student_id);",
            "CREATE INDEX IF NOT EXISTS idx_exercises_workout_id ON exercises(workout_id);",
            "CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_email ON workout_sessions(user_email);",
            "CREATE INDEX IF NOT EXISTS idx_workout_sessions_workout_id ON workout_sessions(workout_id);",
            "CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);",
            "CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);",
        ],
    ),
    (
        "002",
        "workout_templates_and_admin_role",
        [
            "ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;",
            "ALTER TABLE users ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('aluno', 'personal', 'admin'));",
            """
            CREATE TABLE IF NOT EXISTS workout_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                short_name TEXT,
                description TEXT,
                muscle_groups TEXT,
                estimated_duration TEXT,
                color TEXT,
                created_by_id TEXT NOT NULL,
                created_by TEXT,
                created_date TEXT,
                updated_date TEXT,
                is_active BOOLEAN DEFAULT TRUE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS template_exercises (
                id TEXT PRIMARY KEY,
                template_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                image_url TEXT,
                video_url TEXT,
                sets TEXT,
                reps TEXT,
                weight TEXT,
                rest_seconds TEXT,
                "order" TEXT,
                muscle_group TEXT,
                created_by_id TEXT,
                created_by TEXT,
                created_date TEXT,
                updated_date TEXT,
                CONSTRAINT fk_template_exercises_template
                  FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS student_template_assignments (
                id TEXT PRIMARY KEY,
                student_id TEXT NOT NULL,
                template_id TEXT NOT NULL,
                assigned_by_id TEXT NOT NULL,
                assigned_by TEXT,
                assigned_date TEXT,
                notes TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                CONSTRAINT fk_assignment_student
                  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                CONSTRAINT fk_assignment_template
                  FOREIGN KEY (template_id) REFERENCES workout_templates(id) ON DELETE CASCADE
            );
            """,
            "CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by_id ON workout_templates(created_by_id);",
            "CREATE INDEX IF NOT EXISTS idx_template_exercises_template_id ON template_exercises(template_id);",
            "CREATE INDEX IF NOT EXISTS idx_student_template_assignments_student_id ON student_template_assignments(student_id);",
            "CREATE INDEX IF NOT EXISTS idx_student_template_assignments_template_id ON student_template_assignments(template_id);",
        ],
    ),
]


def ensure_migrations_table(conn) -> None:
    """Cria a tabela schema_migrations se não existir."""
    with conn.cursor() as cur:
        cur.execute(MIGRATIONS_TABLE_SQL)
    conn.commit()


def get_applied_versions(conn) -> set:
    """Retorna o conjunto de versões já aplicadas."""
    ensure_migrations_table(conn)
    with conn.cursor() as cur:
        cur.execute("SELECT version FROM schema_migrations")
        return {row["version"] for row in cur.fetchall()}


def apply_migration(conn, version: str, name: str, statements: List[str]) -> None:
    """Executa os SQLs de uma migração e registra em schema_migrations."""
    with conn.cursor() as cur:
        for sql in statements:
            sql = sql.strip()
            if sql:
                cur.execute(sql)
        cur.execute(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (%s, %s, %s)",
            (version, name, datetime.now(timezone.utc)),
        )
    conn.commit()


def run_migrations() -> bool:
    """Aplica todas as migrações pendentes. Retorna True se algo foi aplicado."""
    conn = get_connection()
    try:
        applied = get_applied_versions(conn)
        ran_any = False
        for version, name, statements in MIGRATIONS:
            if version in applied:
                continue
            print(f"  Aplicando {version} ({name})...")
            apply_migration(conn, version, name, statements)
            ran_any = True
        return ran_any
    finally:
        conn.close()


def show_status() -> None:
    """Lista o status das migrações (aplicadas e pendentes)."""
    conn = get_connection()
    try:
        applied = get_applied_versions(conn)
        print("Migrações aplicadas:")
        with conn.cursor() as cur:
            cur.execute(
                "SELECT version, name, applied_at FROM schema_migrations ORDER BY id"
            )
            for row in cur.fetchall():
                print(f"  {row['version']} - {row['name']} ({row['applied_at']})")
        pending = [m for m in MIGRATIONS if m[0] not in applied]
        if pending:
            print("\nPendentes:")
            for version, name, _ in pending:
                print(f"  {version} - {name}")
        else:
            print("\nNenhuma migração pendente.")
    finally:
        conn.close()


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "--status":
        show_status()
        return

    print("Verificando migrações...")
    try:
        ran = run_migrations()
        if ran:
            print("Migrações aplicadas com sucesso.")
        else:
            print("Nenhuma migração pendente. Banco em dia.")
    except psycopg2.OperationalError as e:
        print("Erro de conexão com o PostgreSQL:", file=sys.stderr)
        print(f"  {e}", file=sys.stderr)
        print(
            "\nVerifique: 1) Postgres está rodando  2) .env com PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD corretos.",
            file=sys.stderr,
        )
        sys.exit(1)
    except (ValueError, TypeError, KeyError, RuntimeError) as e:
        print(f"Erro ao rodar migrações: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
