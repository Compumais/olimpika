"""
Seed do banco de dados PostgreSQL (Olimpika).

Garante o schema (tabelas) e insere dados iniciais:
- Usuários (admin, personal e aluno)
- Alunos (students)
- Treinos (workouts)
- Exercícios (templates e vinculados a treino)
- Templates de treino e exercícios de template
- Vínculos aluno ↔ template
- Sessões de treino (workout_sessions)

Uso (com Postgres rodando, ex.: docker compose up -d postgres):
    cd python-backend
    pip install -r requirements.txt
    python seed.py
"""
from __future__ import annotations

import hashlib
import uuid
from datetime import datetime, timezone

from db import with_connection
from migration import run_migrations

NOW = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def ensure_schema() -> None:
    """Aplica migrações pendentes (cria/atualiza tabelas no Postgres)."""
    run_migrations()


# --- Usuários de exemplo ---
SEED_USERS = [
    {
        "id": "seed-admin-001",
        "email": "admin@olimpika.com",
        "password": "admin123",
        "full_name": "Admin Olimpika",
        "user_type": "admin",
    },
    {
        "id": "seed-personal-001",
        "email": "personal@olimpika.com",
        "password": "senha123",
        "full_name": "Personal Silva",
        "user_type": "personal",
    },
    {
        "id": "seed-aluno-001",
        "email": "aluno@olimpika.com",
        "password": "senha123",
        "full_name": "Aluno Costa",
        "user_type": "aluno",
    },
]

SEED_WORKOUT_TEMPLATES = [
    {
        "id": "seed-template-001",
        "name": "Template A - Peito e Tríceps",
        "short_name": "TP-A",
        "description": "Template compartilhado para foco em peito e tríceps.",
        "muscle_groups": "Peito, Tríceps",
        "estimated_duration": "50",
        "color": "bg-yellow-500",
        "created_by_id": "seed-personal-001",
        "created_by": "personal@olimpika.com",
    },
    {
        "id": "seed-template-002",
        "name": "Template B - Costas e Bíceps",
        "short_name": "TP-B",
        "description": "Template compartilhado para foco em costas e bíceps.",
        "muscle_groups": "Costas, Bíceps",
        "estimated_duration": "55",
        "color": "bg-blue-500",
        "created_by_id": "seed-personal-001",
        "created_by": "personal@olimpika.com",
    },
]

SEED_TEMPLATE_EXERCISES = [
    {
        "id": "seed-template-ex-001",
        "template_id": "seed-template-001",
        "name": "Supino Reto",
        "description": "Desça a barra controladamente e empurre com explosão.",
        "sets": "4",
        "reps": "12, 10, 8, 8",
        "weight": "40kg",
        "rest_seconds": "90",
        "order": "1",
        "muscle_group": "Peito",
    },
    {
        "id": "seed-template-ex-002",
        "template_id": "seed-template-001",
        "name": "Tríceps Corda",
        "description": "Estenda os cotovelos e abra a corda no final do movimento.",
        "sets": "4",
        "reps": "12-15",
        "weight": "20kg",
        "rest_seconds": "60",
        "order": "2",
        "muscle_group": "Tríceps",
    },
    {
        "id": "seed-template-ex-003",
        "template_id": "seed-template-002",
        "name": "Puxada Frontal",
        "description": "Puxe até o peito mantendo escápulas encaixadas.",
        "sets": "4",
        "reps": "12, 10, 8, 8",
        "weight": "50kg",
        "rest_seconds": "90",
        "order": "1",
        "muscle_group": "Costas",
    },
    {
        "id": "seed-template-ex-004",
        "template_id": "seed-template-002",
        "name": "Rosca Direta",
        "description": "Flexione os cotovelos sem mover os ombros.",
        "sets": "4",
        "reps": "10-12",
        "weight": "15kg",
        "rest_seconds": "60",
        "order": "2",
        "muscle_group": "Bíceps",
    },
]

# --- Exercícios de exemplo (templates) ---
SEED_EXERCISES = [
    {
        "name": "Supino Reto",
        "description": "Deite no banco, agarre a barra na largura dos ombros, desça até o peito e empurre.",
        "image_url": "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400",
        "video_url": "https://www.youtube.com/watch?v=fG_03xSzT2s",
        "sets": "4",
        "reps": "12, 10, 8, 8",
        "weight": "40kg",
        "rest_seconds": "90",
        "muscle_group": "Peito",
    },
    {
        "name": "Puxada Frontal",
        "description": "Puxe a barra até a altura do queixo, contraindo as escápulas.",
        "image_url": "https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "12, 10, 8, 8",
        "weight": "50kg",
        "rest_seconds": "90",
        "muscle_group": "Costas",
    },
    {
        "name": "Agachamento Livre",
        "description": "Coxas paralelas ao chão, costas retas.",
        "image_url": "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "12, 10, 8, 8",
        "weight": "60kg",
        "rest_seconds": "120",
        "muscle_group": "Pernas",
    },
    {
        "name": "Rosca Direta",
        "description": "Barra ou halteres: flexione os cotovelos mantendo os braços parados.",
        "image_url": "https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "10-12",
        "weight": "15kg",
        "rest_seconds": "60",
        "muscle_group": "Bíceps",
    },
]


def seed_users(conn) -> int:
    cur = conn.cursor()
    count = 0
    for u in SEED_USERS:
        cur.execute(
            "SELECT id FROM users WHERE email = ?",
            (u["email"],),
        )
        if cur.fetchone():
            continue
        cur.execute(
            """INSERT INTO users (id, email, password_hash, full_name, user_type, created_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                u["id"],
                u["email"],
                _hash_password(u["password"]),
                u["full_name"],
                u["user_type"],
                NOW,
            ),
        )
        count += 1
    conn.commit()
    return count


def seed_students(conn) -> int:
    cur = conn.cursor()
    count = 0
    aluno = next((u for u in SEED_USERS if u["user_type"] == "aluno"), None)
    if not aluno:
        return 0
    cur.execute("SELECT id FROM students WHERE email = ?", (aluno["email"],))
    if cur.fetchone():
        return 0
    student_id = "seed-student-001"
    cur.execute(
        """INSERT INTO students (id, name, email, personal_trainer_email, created_date, updated_date, is_sample)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            student_id,
            aluno["full_name"],
            aluno["email"],
            "personal@olimpika.com",
            NOW,
            NOW,
            True,
        ),
    )
    count += 1
    conn.commit()
    return count


def seed_workouts(conn) -> int:
    cur = conn.cursor()
    cur.execute("SELECT id FROM students WHERE email = ?", ("aluno@olimpika.com",))
    row = cur.fetchone()
    if not row:
        return 0
    student_id = row["id"]
    cur.execute(
        "SELECT id FROM workouts WHERE student_id = ? AND name = ?",
        (student_id, "Treino A - Superior"),
    )
    if cur.fetchone():
        return 0
    workout_id = "seed-workout-001"
    cur.execute(
        """INSERT INTO workouts (
            id, name, short_name, description, muscle_groups, estimated_duration,
            color, student_id, created_date, updated_date, is_sample
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            workout_id,
            "Treino A - Superior",
            "Sup A",
            "Peito, costas, ombros e braços",
            "Peito, Costas, Bíceps, Tríceps",
            "45",
            "#4CAF50",
            student_id,
            NOW,
            NOW,
            True,
        ),
    )
    conn.commit()
    return 1


def seed_exercises(conn) -> int:
    cur = conn.cursor()
    inserted = 0
    for i, ex in enumerate(SEED_EXERCISES):
        cur.execute(
            "SELECT id FROM exercises WHERE is_template = TRUE AND name = ?",
            (ex["name"],),
        )
        if cur.fetchone():
            continue
        ex_id = uuid.uuid4().hex
        cur.execute(
            """INSERT INTO exercises (
                id, workout_id, name, description, image_url, video_url,
                sets, reps, weight, rest_seconds, "order", is_template, muscle_group,
                created_date, updated_date, is_sample
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                ex_id,
                None,
                ex["name"],
                ex.get("description", ""),
                ex.get("image_url", ""),
                ex.get("video_url", ""),
                ex.get("sets", "3"),
                ex.get("reps", "12"),
                ex.get("weight", ""),
                ex.get("rest_seconds", "60"),
                str(i),
                True,  # is_template
                ex.get("muscle_group", ""),
                NOW,
                NOW,
                True,  # is_sample
            ),
        )
        inserted += 1
    conn.commit()
    return inserted


def seed_workout_exercises(conn) -> int:
    """Vincula alguns exercícios template ao treino seed-workout-001."""
    cur = conn.cursor()
    cur.execute("SELECT id FROM workouts WHERE id = ?", ("seed-workout-001",))
    if not cur.fetchone():
        return 0
    cur.execute(
        """SELECT id, name, "order" FROM exercises WHERE workout_id = ?""",
        ("seed-workout-001",),
    )
    if cur.fetchall():
        return 0
    cur.execute(
        """SELECT id, name FROM exercises WHERE is_template = TRUE ORDER BY "order" LIMIT 3"""
    )
    templates = cur.fetchall()
    if not templates:
        return 0
    for i, t in enumerate(templates):
        new_id = uuid.uuid4().hex
        cur.execute(
            """INSERT INTO exercises (
                id, workout_id, name, description, image_url, video_url,
                sets, reps, weight, rest_seconds, "order", is_template, muscle_group,
                created_date, updated_date, is_sample
            )
            SELECT ?, 'seed-workout-001', name, description, image_url, video_url,
                   sets, reps, weight, rest_seconds, ?, FALSE, muscle_group,
                   ?, ?, is_sample
            FROM exercises WHERE id = ?""",
            (new_id, str(i), NOW, NOW, t["id"]),
        )
    conn.commit()
    return len(templates)


def seed_workout_sessions(conn) -> int:
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM workout_sessions WHERE user_email = ? AND is_sample = TRUE",
        ("aluno@olimpika.com",),
    )
    if cur.fetchone():
        return 0
    session_id = "seed-session-001"
    cur.execute(
        """INSERT INTO workout_sessions (
            id, user_email, workout_id, workout_name, date, start_time, end_time,
            duration_minutes, status, exercises_completed, created_date, updated_date, is_sample
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            session_id,
            "aluno@olimpika.com",
            "seed-workout-001",
            "Treino A - Superior",
            NOW[:10],
            "08:00",
            "08:45",
            "45",
            "completed",
            "3",
            NOW,
            NOW,
            True,
        ),
    )
    conn.commit()
    return 1


def seed_workout_templates(conn) -> int:
    cur = conn.cursor()
    inserted = 0
    for t in SEED_WORKOUT_TEMPLATES:
        cur.execute("SELECT id FROM workout_templates WHERE id = ?", (t["id"],))
        if cur.fetchone():
            continue
        cur.execute(
            """
            INSERT INTO workout_templates (
                id, name, short_name, description, muscle_groups,
                estimated_duration, color, created_by_id, created_by,
                created_date, updated_date, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
            """,
            (
                t["id"],
                t["name"],
                t.get("short_name"),
                t.get("description"),
                t.get("muscle_groups"),
                t.get("estimated_duration"),
                t.get("color"),
                t.get("created_by_id"),
                t.get("created_by"),
                NOW,
                NOW,
            ),
        )
        inserted += 1
    conn.commit()
    return inserted


def seed_template_exercises(conn) -> int:
    cur = conn.cursor()
    inserted = 0
    for ex in SEED_TEMPLATE_EXERCISES:
        cur.execute("SELECT id FROM template_exercises WHERE id = ?", (ex["id"],))
        if cur.fetchone():
            continue
        cur.execute(
            """
            INSERT INTO template_exercises (
                id, template_id, name, description, image_url, video_url,
                sets, reps, weight, rest_seconds, "order", muscle_group,
                created_by_id, created_by, created_date, updated_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                ex["id"],
                ex["template_id"],
                ex["name"],
                ex.get("description", ""),
                ex.get("image_url", ""),
                ex.get("video_url", ""),
                ex.get("sets", "3"),
                ex.get("reps", "12"),
                ex.get("weight", ""),
                ex.get("rest_seconds", "60"),
                ex.get("order", "1"),
                ex.get("muscle_group", ""),
                "seed-personal-001",
                "personal@olimpika.com",
                NOW,
                NOW,
            ),
        )
        inserted += 1
    conn.commit()
    return inserted


def seed_template_assignments(conn) -> int:
    cur = conn.cursor()
    cur.execute("SELECT id FROM students WHERE email = ?", ("aluno@olimpika.com",))
    student = cur.fetchone()
    if not student:
        return 0

    cur.execute(
        """
        SELECT id FROM student_template_assignments
        WHERE student_id = ? AND template_id = ? AND is_active = TRUE
        """,
        (student["id"], "seed-template-001"),
    )
    if cur.fetchone():
        return 0

    assignment_id = "seed-assignment-001"
    cur.execute(
        """
        INSERT INTO student_template_assignments (
            id, student_id, template_id, assigned_by_id, assigned_by, assigned_date, notes, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
        """,
        (
            assignment_id,
            student["id"],
            "seed-template-001",
            "seed-admin-001",
            "admin@olimpika.com",
            NOW,
            "Vínculo de template criado pelo seed.",
        ),
    )
    conn.commit()
    return 1


def main() -> None:
    print("Criando schema (tabelas)...")
    ensure_schema()

    print("Inserindo dados iniciais...")
    with with_connection() as conn:
        n_users = seed_users(conn)
        n_students = seed_students(conn)
        n_workouts = seed_workouts(conn)
        n_exercises = seed_exercises(conn)
        n_workout_exercises = seed_workout_exercises(conn)
        n_templates = seed_workout_templates(conn)
        n_template_exercises = seed_template_exercises(conn)
        n_assignments = seed_template_assignments(conn)
        n_sessions = seed_workout_sessions(conn)

    print("Seed concluído:")
    print(f"  - Usuários: {n_users}")
    print(f"  - Alunos: {n_students}")
    print(f"  - Treinos: {n_workouts}")
    print(f"  - Exercícios (templates): {n_exercises}")
    print(f"  - Exercícios no treino: {n_workout_exercises}")
    print(f"  - Templates de treino: {n_templates}")
    print(f"  - Exercícios de template: {n_template_exercises}")
    print(f"  - Vínculos aluno-template: {n_assignments}")
    print(f"  - Sessões de treino: {n_sessions}")
    print("\nLogins de teste:")
    print("  - admin@olimpika.com / senha: admin123")
    print("  - personal@olimpika.com / senha: senha123")
    print("  - aluno@olimpika.com / senha: senha123")


if __name__ == "__main__":
    main()
