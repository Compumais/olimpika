"""
Cadastra exercícios de exemplo (templates) na biblioteca, com imagem.

Versão para Postgres (Docker):
- Usa mesma configuração do backend (db.py)
- Insere linhas na tabela exercises com:
  - workout_id = NULL (templates independentes)
  - is_template = TRUE

Execute com o backend parado:
    cd python-backend
    python seed_example_exercises.py
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import psycopg2
from psycopg2.extras import RealDictCursor

NOW = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

# Mesmo padrão do db.py / docker-compose
PG_CONFIG = {
  "host": os.environ.get("PGHOST", "localhost"),
  "port": int(os.environ.get("PGPORT", "5432")),
  "dbname": os.environ.get("PGDATABASE", "olimpika"),
  "user": os.environ.get("PGUSER", "olimpika_user"),
  "password": os.environ.get("PGPASSWORD", "olimpika_pass"),
}

# Exercícios de exemplo com imagem (Unsplash - uso livre)
EXERCISES = [
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
        "name": "Supino Inclinado com Halteres",
        "description": "No banco inclinado 30-45°, desça os halteres até a linha dos mamilos.",
        "image_url": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "10-12",
        "weight": "18kg",
        "rest_seconds": "75",
        "muscle_group": "Peito",
    },
    {
        "name": "Crucifixo na Máquina",
        "description": "Cotovelos levemente flexionados, junte as mãos à frente do peito.",
        "image_url": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "12-15",
        "weight": "25kg",
        "rest_seconds": "60",
        "muscle_group": "Peito",
    },
    {
        "name": "Tríceps Francês",
        "description": "Halter acima da cabeça, desça atrás da nuca estendendo os cotovelos.",
        "image_url": "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "10-12",
        "weight": "12kg",
        "rest_seconds": "60",
        "muscle_group": "Tríceps",
    },
    {
        "name": "Tríceps Corda",
        "description": "Polia alta: puxe a corda para baixo estendendo os cotovelos, abrindo no final.",
        "image_url": "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "12-15",
        "weight": "20kg",
        "rest_seconds": "60",
        "muscle_group": "Tríceps",
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
        "name": "Remada Curvada",
        "description": "Incline o tronco, costas retas, puxe a barra até o abdômen.",
        "image_url": "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "10-12",
        "weight": "40kg",
        "rest_seconds": "75",
        "muscle_group": "Costas",
    },
    {
        "name": "Remada Unilateral",
        "description": "Apoie um joelho no banco, puxe o halter até a cintura.",
        "image_url": "https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "10-12",
        "weight": "20kg",
        "rest_seconds": "60",
        "muscle_group": "Costas",
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
    {
        "name": "Rosca Martelo",
        "description": "Halteres com pegada neutra, flexione alternadamente.",
        "image_url": "https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "12",
        "weight": "12kg",
        "rest_seconds": "60",
        "muscle_group": "Bíceps",
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
        "name": "Leg Press",
        "description": "Pés na plataforma, empurre controladamente.",
        "image_url": "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "12-15",
        "weight": "120kg",
        "rest_seconds": "90",
        "muscle_group": "Pernas",
    },
    {
        "name": "Cadeira Extensora",
        "description": "Estenda as pernas completamente, contraindo o quadríceps.",
        "image_url": "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "12-15",
        "weight": "40kg",
        "rest_seconds": "60",
        "muscle_group": "Pernas",
    },
    {
        "name": "Mesa Flexora",
        "description": "Flexione as pernas até 90°, contraindo os posteriores.",
        "image_url": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400",
        "video_url": "",
        "sets": "3",
        "reps": "12-15",
        "weight": "35kg",
        "rest_seconds": "60",
        "muscle_group": "Pernas",
    },
    {
        "name": "Panturrilha em Pé",
        "description": "Eleve-se na ponta dos pés e desça controladamente.",
        "image_url": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
        "video_url": "",
        "sets": "4",
        "reps": "15-20",
        "weight": "50kg",
        "rest_seconds": "45",
        "muscle_group": "Pernas",
    },
]


def main():
    conn = psycopg2.connect(cursor_factory=RealDictCursor, **PG_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                inserted = 0
                for i, ex in enumerate(EXERCISES):
                    ex_id = uuid.uuid4().hex
                    cur.execute(
                        """
                        INSERT INTO exercises (
                            id, workout_id, name, description, image_url, video_url,
                            sets, reps, weight, rest_seconds, "order", is_template, muscle_group,
                            created_date, updated_date, is_sample
                        ) VALUES (
                            %s, %s, %s, %s, %s, %s,
                            %s, %s, %s, %s, %s, TRUE, %s,
                            %s, %s, FALSE
                        )
                        """,
                        (
                            ex_id,
                            None,  # workout_id nulo para templates
                            ex["name"],
                            ex.get("description", ""),
                            ex.get("image_url", ""),
                            ex.get("video_url", ""),
                            ex.get("sets", "3"),
                            ex.get("reps", "12"),
                            ex.get("weight", ""),
                            ex.get("rest_seconds", "60"),
                            str(i),
                            ex.get("muscle_group", ""),
                            NOW,
                            NOW,
                        ),
                    )
                    inserted += 1

        print(f"Cadastrados {inserted} exercícios de exemplo na biblioteca (com imagem) no Postgres.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
