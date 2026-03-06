"""
Limpa todos os dados da tabela users no SQLite.
Execute com o backend parado: python clear_users.py
"""
from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "data" / "academia.db"

def main():
    if not DB_PATH.exists():
        print(f"Banco não encontrado: {DB_PATH}")
        return
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA busy_timeout=30000")
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM users")
    n = cur.fetchone()[0]
    cur.execute("DELETE FROM users")
    conn.commit()
    conn.close()
    print(f"Tabela 'users' limpa: {n} registro(s) removido(s).")

if __name__ == "__main__":
    main()
