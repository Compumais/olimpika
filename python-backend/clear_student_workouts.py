"""
Remove todos os treinos atribuídos aos alunos.

- Apaga treinos (workouts) com student_id preenchido e seus exercícios
- Remove atribuições de templates (student_template_assignments)
- Preserva: workout_templates, students, users, workout_sessions (com workout_id = NULL)

Usa as variáveis de ambiente do db (.env).

Uso:
    cd python-backend
    python clear_student_workouts.py
    python clear_student_workouts.py --force   # sem confirmação
"""

from __future__ import annotations

import sys

import psycopg2
from db import get_connection


def run(conn) -> tuple[int, int, int]:
    """Retorna (exercises_deleted, workouts_deleted, assignments_deactivated)."""
    cur = conn.cursor()

    # Exercícios de treinos vinculados a alunos
    cur.execute("""
        DELETE FROM exercises
        WHERE workout_id IN (SELECT id FROM workouts WHERE student_id IS NOT NULL)
    """)
    exercises_deleted = cur.rowcount

    # Sessões: desvincula workout_id para preservar histórico
    cur.execute("""
        UPDATE workout_sessions
        SET workout_id = NULL
        WHERE workout_id IN (SELECT id FROM workouts WHERE student_id IS NOT NULL)
    """)

    # Treinos dos alunos
    cur.execute("DELETE FROM workouts WHERE student_id IS NOT NULL")
    workouts_deleted = cur.rowcount

    # Desativa atribuições de templates aos alunos
    cur.execute("UPDATE student_template_assignments SET is_active = FALSE WHERE is_active = TRUE")
    assignments_deactivated = cur.rowcount

    conn.commit()
    return exercises_deleted, workouts_deleted, assignments_deactivated


def main() -> None:
    force = "--force" in sys.argv or "-f" in sys.argv

    try:
        conn = get_connection()
    except psycopg2.Error as e:
        print(f"Erro ao conectar: {e}", file=sys.stderr)
        print("Verifique o .env (PGHOST, PGDATABASE, PGUSER, PGPASSWORD).", file=sys.stderr)
        sys.exit(1)

    try:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) AS n FROM workouts WHERE student_id IS NOT NULL")
        n_workouts = cur.fetchone()["n"]
        cur.execute("SELECT COUNT(*) AS n FROM student_template_assignments WHERE is_active = TRUE")
        n_assignments = cur.fetchone()["n"]

        print(f"Treinos atribuídos a alunos: {n_workouts}")
        print(f"Atribuições de templates ativas: {n_assignments}")
        print()

        if not force and (n_workouts > 0 or n_assignments > 0):
            r = input("Apagar todos? (s/N) ").strip().lower()
            if r not in ("s", "sim", "y", "yes"):
                print("Cancelado.")
                return

        ex, w, a = run(conn)
        print(f"Exercícios removidos: {ex}")
        print(f"Treinos removidos: {w}")
        print(f"Atribuições de templates desativadas: {a}")
        print("\nConcluído.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
