from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from db import with_connection

app = FastAPI(title="Academia API (Python + SQLite)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEBUG_LOG_PATH = Path(__file__).resolve().parent.parent / "debug-c7559d.log"


def rows_to_dicts(rows) -> List[Dict[str, Any]]:
    return [dict(row) for row in rows]


def row_to_dict(row) -> Dict[str, Any]:
    return dict(row)


@app.get("/health")
def healthcheck() -> Dict[str, str]:
    return {"status": "ok"}


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


# ---------------------------
# Auth (SQLite)
# ---------------------------

@app.post("/auth/register")
def auth_register(payload: Dict[str, Any]):
    email = (payload.get("email") or "").strip().lower()
    full_name = (payload.get("full_name") or "").strip()
    user_type = (payload.get("user_type") or "").strip().lower()
    password = (payload.get("password") or "").strip()

    if not email or not full_name or user_type not in ("aluno", "personal"):
        raise HTTPException(
            status_code=400,
            detail="Dados inválidos: e-mail, nome e tipo (aluno/personal) são obrigatórios.",
        )
    if not password or len(password) < 6:
        raise HTTPException(
            status_code=400,
            detail="A senha deve ter no mínimo 6 caracteres.",
        )

    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="E-mail já cadastrado.")

        user_id = uuid.uuid4().hex
        password_hash = _hash_password(password)
        created_at = datetime.utcnow().isoformat() + "Z"

        cur.execute(
            "INSERT INTO users (id, email, password_hash, full_name, user_type, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, password_hash, full_name, user_type, created_at),
        )

        student_id = None
        if user_type == "aluno":
            student_id = uuid.uuid4().hex
            cur.execute(
                """INSERT INTO students (id, name, email, personal_trainer_email, created_date, updated_date, is_sample)
                   VALUES (?, ?, ?, '', ?, ?, FALSE)""",
                (student_id, full_name, email, created_at, created_at),
            )

        conn.commit()
        cur.execute(
            "SELECT id, email, full_name, user_type, created_at FROM users WHERE id = ?",
            (user_id,),
        )
        row = cur.fetchone()

    out = row_to_dict(row)
    out["student_id"] = student_id
    return out


@app.post("/auth/login")
def auth_login(payload: Dict[str, Any]):
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        raise HTTPException(status_code=400, detail="E-mail e senha são obrigatórios.")

    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id, email, password_hash, full_name, user_type, created_at FROM users WHERE email = ?", (email,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        if _hash_password(password) != row["password_hash"]:
            raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")

        student_id = None
        if row["user_type"] == "aluno":
            cur.execute("SELECT id FROM students WHERE email = ?", (email,))
            s = cur.fetchone()
            if s:
                student_id = s["id"]

    return {
        "id": row["id"],
        "email": row["email"],
        "full_name": row["full_name"],
        "user_type": row["user_type"],
        "created_at": row["created_at"],
        "student_id": student_id,
    }


@app.get("/auth/users")
def list_users():
    """Lista usuários cadastrados (sem expor senha)."""
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute(
            "SELECT id, email, full_name, user_type, created_at FROM users ORDER BY created_at DESC"
        )
        rows = cur.fetchall()
    return rows_to_dicts(rows)


@app.post("/auth/reset-password")
def reset_password(payload: Dict[str, Any]):
    """
    Módulo simples de "esqueci minha senha".
    Atualiza a senha apenas com base no e-mail informado.
    """
    email = (payload.get("email") or "").strip().lower()
    new_password = (payload.get("new_password") or "").strip()

    if not email or not new_password:
        raise HTTPException(status_code=400, detail="E-mail e nova senha são obrigatórios.")
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="A nova senha deve ter no mínimo 6 caracteres.")

    password_hash = _hash_password(new_password)

    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("UPDATE users SET password_hash = ? WHERE email = ?", (password_hash, email))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Usuário não encontrado para este e-mail.")
        conn.commit()

    return {"message": "Senha atualizada com sucesso. Faça login com a nova senha."}


@app.delete("/auth/users")
def clear_all_users():
    """Remove todos os registros da tabela users (útil em desenvolvimento)."""
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM users")
        n = cur.fetchone()[0]
        cur.execute("DELETE FROM users")
        conn.commit()
    return {"deleted": n, "message": f"{n} usuário(s) removido(s)."}


# ---------------------------
# Students
# ---------------------------

@app.get("/students")
def list_students(
    email: Optional[str] = None,
    personal_trainer_email: Optional[str] = None,
    name: Optional[str] = None,
):
    with with_connection() as conn:
        cur = conn.cursor()
        clauses = []
        params: List[Any] = []
        if email:
            clauses.append("email = ?")
            params.append(email)
        if personal_trainer_email:
            clauses.append("personal_trainer_email = ?")
            params.append(personal_trainer_email)
        if name:
            clauses.append("name = ?")
            params.append(name)
        sql = "SELECT * FROM students"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        rows = cur.execute(sql, params).fetchall()
    return rows_to_dicts(rows)


@app.get("/students/{student_id}")
def get_student(student_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        row = cur.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    return row_to_dict(row)


@app.post("/students", status_code=201)
def create_student(payload: Dict[str, Any]):
    data = dict(payload)
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    if not name or not email:
        raise HTTPException(status_code=400, detail="Nome e e-mail são obrigatórios.")
    if "id" not in data or not data["id"]:
        data["id"] = uuid.uuid4().hex
    now = datetime.utcnow().isoformat() + "Z"
    data.setdefault("created_date", now)
    data.setdefault("updated_date", now)
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("SELECT id FROM students WHERE email = ?", (email,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="E-mail já cadastrado para outro aluno.")
        cols = list(data.keys())
        placeholders = ",".join("?" for _ in cols)
        sql = f"INSERT INTO students ({','.join(cols)}) VALUES ({placeholders})"
        cur.execute(sql, [data[c] for c in cols])
        conn.commit()
        row = cur.execute("SELECT * FROM students WHERE id = ?", (data["id"],)).fetchone()
    return row_to_dict(row)


@app.put("/students/{student_id}")
def update_student(student_id: str, payload: Dict[str, Any]):
    if not payload:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(payload.keys())
        set_clause = ", ".join(f"{c} = ?" for c in cols)
        params = [payload[c] for c in cols] + [student_id]
        cur.execute(f"UPDATE students SET {set_clause} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        conn.commit()
        row = cur.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/students/{student_id}", status_code=204)
def delete_student(student_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM students WHERE id = ?", (student_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
        conn.commit()
    return {}


# ---------------------------
# Workouts
# ---------------------------

@app.get("/workouts")
def list_workouts(
    student_id: Optional[str] = None,
    name: Optional[str] = None,
    short_name: Optional[str] = None,
):
    with with_connection() as conn:
        cur = conn.cursor()
        clauses = []
        params: List[Any] = []
        if student_id:
            clauses.append("student_id = ?")
            params.append(student_id)
        if name:
            clauses.append("name = ?")
            params.append(name)
        if short_name:
            clauses.append("short_name = ?")
            params.append(short_name)
        sql = "SELECT * FROM workouts"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        rows = cur.execute(sql, params).fetchall()
    return rows_to_dicts(rows)


@app.get("/workouts/{workout_id}")
def get_workout(workout_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        row = cur.execute("SELECT * FROM workouts WHERE id = ?", (workout_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    return row_to_dict(row)


@app.post("/workouts", status_code=201)
def create_workout(payload: Dict[str, Any]):
    data = dict(payload)
    if "id" not in data or not data["id"]:
        data["id"] = uuid.uuid4().hex
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(data.keys())
        placeholders = ",".join("?" for _ in cols)
        sql = f"INSERT INTO workouts ({','.join(cols)}) VALUES ({placeholders})"
        cur.execute(sql, [data[c] for c in cols])
        conn.commit()
        row = cur.execute("SELECT * FROM workouts WHERE id = ?", (data["id"],)).fetchone()
    return row_to_dict(row)


@app.put("/workouts/{workout_id}")
def update_workout(workout_id: str, payload: Dict[str, Any]):
    if not payload:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(payload.keys())
        set_clause = ", ".join(f"{c} = ?" for c in cols)
        params = [payload[c] for c in cols] + [workout_id]
        cur.execute(f"UPDATE workouts SET {set_clause} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        conn.commit()
        row = cur.execute("SELECT * FROM workouts WHERE id = ?", (workout_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/workouts/{workout_id}", status_code=204)
def delete_workout(workout_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM workouts WHERE id = ?", (workout_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        conn.commit()
    return {}


# ---------------------------
# Exercises
# ---------------------------

@app.get("/exercises")
def list_exercises(
    workout_id: Optional[str] = None,
    name: Optional[str] = None,
    muscle_group: Optional[str] = None,
    is_template: Optional[str] = None,
):
    with with_connection() as conn:
        cur = conn.cursor()
        clauses = []
        params: List[Any] = []
        if workout_id:
            clauses.append("workout_id = ?")
            params.append(workout_id)
        if name:
            clauses.append("name = ?")
            params.append(name)
        if muscle_group:
            clauses.append("muscle_group = ?")
            params.append(muscle_group)
        if is_template is not None:
            value = is_template.lower()
            if value == "true":
                clauses.append("is_template = TRUE")
            elif value == "false":
                clauses.append("is_template = FALSE")
        sql = "SELECT * FROM exercises"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        rows = cur.execute(sql, params).fetchall()
    return rows_to_dicts(rows)


@app.get("/exercises/{exercise_id}")
def get_exercise(exercise_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        row = cur.execute("SELECT * FROM exercises WHERE id = ?", (exercise_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Exercício não encontrado")
    return row_to_dict(row)


def _quote_ident(name: str) -> str:
    """Coluna 'order' é reservada no SQLite; aspas duplas evitam erro de sintaxe."""
    return f'"{name}"'


@app.post("/exercises", status_code=201)
def create_exercise(payload: Dict[str, Any]):
    data = dict(payload)
    if "id" not in data or not data["id"]:
        data["id"] = uuid.uuid4().hex
    name = (data.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome do exercício é obrigatório.")
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(data.keys())
        # Todas as colunas entre aspas para evitar erro com palavra reservada "order"
        cols_sql = ",".join(_quote_ident(c) for c in cols)
        placeholders = ",".join("?" for _ in cols)
        sql = f"INSERT INTO exercises ({cols_sql}) VALUES ({placeholders})"
        cur.execute(sql, [data[c] for c in cols])
        conn.commit()
        row = cur.execute("SELECT * FROM exercises WHERE id = ?", (data["id"],)).fetchone()
    return row_to_dict(row)


@app.put("/exercises/{exercise_id}")
def update_exercise(exercise_id: str, payload: Dict[str, Any]):
    if not payload:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(payload.keys())
        set_clause = ", ".join(f"{_quote_ident(c)} = ?" for c in cols)
        params = [payload[c] for c in cols] + [exercise_id]
        cur.execute(f"UPDATE exercises SET {set_clause} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Exercício não encontrado")
        conn.commit()
        row = cur.execute("SELECT * FROM exercises WHERE id = ?", (exercise_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/exercises/{exercise_id}", status_code=204)
def delete_exercise(exercise_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM exercises WHERE id = ?", (exercise_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Exercício não encontrado")
        conn.commit()
    return {}


# ---------------------------
# Workout Sessions
# ---------------------------

@app.get("/workout-sessions")
def list_workout_sessions(
    user_email: Optional[str] = None,
    workout_id: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
):
    with with_connection() as conn:
        cur = conn.cursor()
        clauses = []
        params: List[Any] = []
        if user_email:
            clauses.append("user_email = ?")
            params.append(user_email)
        if workout_id:
            clauses.append("workout_id = ?")
            params.append(workout_id)
        if date:
            clauses.append("date = ?")
            params.append(date)
        if status:
            clauses.append("status = ?")
            params.append(status)
        sql = "SELECT * FROM workout_sessions"
        if clauses:
            sql += " WHERE " + " AND ".join(clauses)
        rows = cur.execute(sql, params).fetchall()
    return rows_to_dicts(rows)


@app.get("/workout-sessions/{session_id}")
def get_workout_session(session_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        row = cur.execute("SELECT * FROM workout_sessions WHERE id = ?", (session_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    return row_to_dict(row)


@app.post("/workout-sessions", status_code=201)
def create_workout_session(payload: Dict[str, Any]):
    data = dict(payload)
    if "id" not in data or not data["id"]:
        data["id"] = uuid.uuid4().hex
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(data.keys())
        placeholders = ",".join("?" for _ in cols)
        sql = f"INSERT INTO workout_sessions ({','.join(cols)}) VALUES ({placeholders})"
        cur.execute(sql, [data[c] for c in cols])
        conn.commit()
        row = cur.execute("SELECT * FROM workout_sessions WHERE id = ?", (data["id"],)).fetchone()
    return row_to_dict(row)


@app.put("/workout-sessions/{session_id}")
def update_workout_session(session_id: str, payload: Dict[str, Any]):
    if not payload:
        raise HTTPException(status_code=400, detail="Dados inválidos")
    with with_connection() as conn:
        cur = conn.cursor()
        cols = list(payload.keys())
        set_clause = ", ".join(f"{c} = ?" for c in cols)
        params = [payload[c] for c in cols] + [session_id]
        # region agent log
        try:
            debug_entry = {
                "sessionId": "c7559d",
                "runId": "pre-fix",
                "hypothesisId": "H3_H4",
                "location": "python-backend/main.py:update_workout_session",
                "message": "Before UPDATE workout_sessions",
                "data": {
                    "session_id": session_id,
                    "keys": cols,
                },
                "timestamp": int(datetime.utcnow().timestamp() * 1000),
            }
            with DEBUG_LOG_PATH.open("a", encoding="utf-8") as f:
                f.write(json.dumps(debug_entry) + "\n")
        except Exception:
            pass
        # endregion agent log
        cur.execute(f"UPDATE workout_sessions SET {set_clause} WHERE id = ?", params)
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        conn.commit()
        row = cur.execute("SELECT * FROM workout_sessions WHERE id = ?", (session_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/workout-sessions/{session_id}", status_code=204)
def delete_workout_session(session_id: str):
    with with_connection() as conn:
        cur = conn.cursor()
        cur.execute("DELETE FROM workout_sessions WHERE id = ?", (session_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Sessão não encontrada")
        conn.commit()
    return {}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=4000, reload=False)

