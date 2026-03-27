"""
Remove a adoção de todos os alunos já adotados.

Define personal_trainer_email = NULL para todos os alunos que têm um personal atribuído.
Os alunos ficam disponíveis para serem adotados novamente por qualquer personal.

Uso:
    cd python-backend
    python unadopt_students.py
    python unadopt_students.py --force   # sem confirmação
"""

from __future__ import annotations

import sys

import psycopg2
from db import get_connection


def run(conn) -> int:
    cur = conn.cursor()
    cur.execute(
        "UPDATE students SET personal_trainer_email = NULL WHERE personal_trainer_email IS NOT NULL"
    )
    n = cur.rowcount
    conn.commit()
    return n


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
        cur.execute("SELECT COUNT(*) AS n FROM students WHERE personal_trainer_email IS NOT NULL")
        n_adopted = cur.fetchone()["n"]

        print(f"Alunos adotados: {n_adopted}")
        print()

        if not force and n_adopted > 0:
            r = input("Remover adoção de todos? (s/N) ").strip().lower()
            if r not in ("s", "sim", "y", "yes"):
                print("Cancelado.")
                return

        n = run(conn)
        print(f"Adoção removida de {n} aluno(s).")
        print("\nConcluído.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
