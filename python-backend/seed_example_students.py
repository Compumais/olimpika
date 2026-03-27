"""
Cria 10 alunos de exemplo com treinos aleatórios.

Os alunos são vinculados ao personal personal@olimpika.com (deve existir).
Cada aluno recebe 1 a 3 treinos com 3 a 6 exercícios cada.

Uso:
    cd python-backend
    python seed_example_students.py
"""
from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, timezone

from db import with_connection

NOW = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
PERSONAL_EMAIL = "personal@olimpika.com"

NOMES_ALUNOS = [
    "Ana Oliveira", "Bruno Santos", "Carlos Lima", "Daniela Souza",
    "Eduardo Costa", "Fernanda Rocha", "Gabriel Alves", "Helena Martins",
    "Igor Pereira", "Julia Ferreira",
]

NOMES_TREINOS = [
    ("Treino A - Peito e Tríceps", "A", "Peito, Tríceps"),
    ("Treino B - Costas e Bíceps", "B", "Costas, Bíceps"),
    ("Treino C - Pernas", "C", "Pernas"),
    ("Treino D - Ombros", "D", "Ombros"),
    ("Treino E - Full Body", "E", "Corpo completo"),
    ("Treino F - Core", "F", "Abdômen"),
    ("Treino G - Superior", "G", "Superior"),
    ("Treino H - Inferior", "H", "Inferior"),
]

EXERCICIOS_BASE = [
    {"name": "Supino Reto", "sets": "4", "reps": "12, 10, 8, 8", "weight": "40kg", "muscle_group": "Peito"},
    {"name": "Tríceps Corda", "sets": "4", "reps": "12-15", "weight": "20kg", "muscle_group": "Tríceps"},
    {"name": "Puxada Frontal", "sets": "4", "reps": "12, 10, 8", "weight": "50kg", "muscle_group": "Costas"},
    {"name": "Rosca Direta", "sets": "4", "reps": "10-12", "weight": "15kg", "muscle_group": "Bíceps"},
    {"name": "Agachamento Livre", "sets": "4", "reps": "12, 10, 8", "weight": "60kg", "muscle_group": "Pernas"},
    {"name": "Leg Press", "sets": "4", "reps": "12-15", "weight": "120kg", "muscle_group": "Pernas"},
    {"name": "Desenvolvimento", "sets": "3", "reps": "12", "weight": "30kg", "muscle_group": "Ombros"},
    {"name": "Remada Curvada", "sets": "4", "reps": "10-12", "weight": "40kg", "muscle_group": "Costas"},
    {"name": "Supino Inclinado", "sets": "3", "reps": "12", "weight": "35kg", "muscle_group": "Peito"},
    {"name": "Cadeira Extensora", "sets": "3", "reps": "15", "weight": "40kg", "muscle_group": "Pernas"},
    {"name": "Stiff", "sets": "3", "reps": "12", "weight": "50kg", "muscle_group": "Pernas"},
    {"name": "Abdominal Crunch", "sets": "3", "reps": "20", "weight": "", "muscle_group": "Core"},
]

CORES = ["bg-blue-500", "bg-yellow-500", "bg-green-500", "bg-red-500", "bg-purple-500"]


def run(conn) -> dict:
    cur = conn.cursor()

    cur.execute("SELECT id FROM users WHERE email = ? AND user_type IN ('personal', 'admin')", (PERSONAL_EMAIL,))
    personal = cur.fetchone()
    if not personal:
        raise RuntimeError(f"Personal {PERSONAL_EMAIL} não encontrado. Execute python seed.py primeiro.")

    personal_id = personal["id"]
    inserted_students = 0
    inserted_workouts = 0
    inserted_exercises = 0

    for i, nome in enumerate(NOMES_ALUNOS):
        email = f"exemplo{i+1}@alunos.olimpika.com"
        cur.execute("SELECT id FROM students WHERE email = ?", (email,))
        if cur.fetchone():
            continue

        student_id = uuid.uuid4().hex
        cur.execute(
            """INSERT INTO students (
                id, name, email, personal_trainer_email, goal, created_date, updated_date, is_sample
            ) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)""",
            (
                student_id,
                nome,
                email,
                PERSONAL_EMAIL,
                random.choice(["Hipertrofia", "Emagrecimento", "Condicionamento", "Força"]),
                NOW,
                NOW,
            ),
        )
        inserted_students += 1

        num_treinos = random.randint(1, 3)
        treinos_escolhidos = random.sample(NOMES_TREINOS, min(num_treinos, len(NOMES_TREINOS)))

        for nome_treino, short, desc in treinos_escolhidos:
            workout_id = uuid.uuid4().hex
            expires_delta = random.randint(7, 90)
            expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_delta)).strftime("%Y-%m-%d") if random.random() > 0.3 else None

            cur.execute(
                """INSERT INTO workouts (
                    id, name, short_name, description, color, student_id,
                    created_date, updated_date, created_by_id, created_by, expires_at, is_sample
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)""",
                (
                    workout_id,
                    nome_treino,
                    short,
                    desc,
                    random.choice(CORES),
                    student_id,
                    NOW,
                    NOW,
                    personal_id,
                    PERSONAL_EMAIL,
                    expires_at,
                ),
            )
            inserted_workouts += 1

            num_exercicios = random.randint(3, 6)
            exercicios_escolhidos = random.sample(EXERCICIOS_BASE, min(num_exercicios, len(EXERCICIOS_BASE)))

            for j, ex in enumerate(exercicios_escolhidos):
                ex_id = uuid.uuid4().hex
                cur.execute(
                    """INSERT INTO exercises (
                        id, workout_id, name, description, sets, reps, weight, rest_seconds, "order",
                        muscle_group, is_template, created_date, updated_date, created_by_id, created_by, is_sample
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, ?, ?, ?, ?, TRUE)""",
                    (
                        ex_id,
                        workout_id,
                        ex["name"],
                        "",
                        ex["sets"],
                        ex["reps"],
                        ex.get("weight", ""),
                        "60",
                        str(j),
                        ex.get("muscle_group", ""),
                        NOW,
                        NOW,
                        personal_id,
                        PERSONAL_EMAIL,
                    ),
                )
                inserted_exercises += 1

    conn.commit()
    return {"students": inserted_students, "workouts": inserted_workouts, "exercises": inserted_exercises}


def main() -> None:
    print("Criando 10 alunos de exemplo com treinos aleatórios...")
    try:
        with with_connection() as conn:
            result = run(conn)
        print(f"  Alunos criados: {result['students']}")
        print(f"  Treinos criados: {result['workouts']}")
        print(f"  Exercícios vinculados: {result['exercises']}")
        print("\nConcluído!")
    except Exception as e:
        print(f"Erro: {e}")
        raise


if __name__ == "__main__":
    main()
