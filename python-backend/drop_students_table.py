"""
Remove a tabela students do SQLite e recria vazia.
Execute com o backend parado: python drop_students_table.py
"""
from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "academia.db"

CREATE_STUDENTS = """
CREATE TABLE students (
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
"""

def main():
    if not DB_PATH.exists():
        print(f"Banco não encontrado: {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    conn.execute("PRAGMA foreign_keys=OFF")
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS students")
    cur.execute(CREATE_STUDENTS)
    conn.commit()
    conn.close()
    print("Tabela 'students' apagada e recriada vazia.")

if __name__ == "__main__":
    main()
