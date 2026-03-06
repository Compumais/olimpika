-- Criação do banco de dados SQLite com as tabelas baseadas nos CSVs

-- Tabela de estudantes (alunos)
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

-- Tabela de treinos (workouts)
CREATE TABLE workouts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT,
    description TEXT,
    muscle_groups TEXT, -- JSON array stored as text
    estimated_duration TEXT,
    color TEXT,
    student_id TEXT,
    created_date TEXT,
    updated_date TEXT,
    created_by_id TEXT,
    created_by TEXT,
    is_sample BOOLEAN DEFAULT false,
    FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Tabela de exercícios (exercises)
CREATE TABLE exercises (
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
    "order" TEXT, -- order is a reserved word, so quoting it
    is_template BOOLEAN DEFAULT false,
    muscle_group TEXT,
    created_date TEXT,
    updated_date TEXT,
    created_by_id TEXT,
    created_by TEXT,
    is_sample BOOLEAN DEFAULT false,
    FOREIGN KEY (workout_id) REFERENCES workouts(id)
);

-- Tabela de sessões de treino (workout sessions)
CREATE TABLE workout_sessions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    workout_id TEXT,
    workout_name TEXT,
    date TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    duration_minutes TEXT,
    status TEXT CHECK(status IN ('completed', 'in_progress', 'cancelled')),
    exercises_completed TEXT, -- JSON array stored as text
    created_date TEXT,
    updated_date TEXT,
    created_by_id TEXT,
    created_by TEXT,
    is_sample BOOLEAN DEFAULT false,
    FOREIGN KEY (user_email) REFERENCES students(email),
    FOREIGN KEY (workout_id) REFERENCES workouts(id)
);

-- Inserindo dados da tabela students
INSERT INTO students (id, name, email, phone, personal_trainer_email, goal, notes, created_date, updated_date, created_by_id, created_by, is_sample) VALUES
('69864c926f7f748b5f37c86a', 'cesar', 'cesar@compumais.com', '34988564561', 'cesar@compumais.com', 'Ganhar musculos', '', '2026-02-06T20:18:26.119000', '2026-02-06T20:18:26.119000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false');

-- Inserindo dados da tabela workouts
INSERT INTO workouts (id, name, short_name, description, muscle_groups, estimated_duration, color, student_id, created_date, updated_date, created_by_id, created_by, is_sample) VALUES
('69864caded508e8ad0783aa9', 'Treiano A', 'A', '', '[]', '', 'bg-blue-500', '69864c926f7f748b5f37c86a', '2026-02-06T20:18:53.921000', '2026-02-06T20:18:53.921000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false');

-- Inserindo dados da tabela exercises
INSERT INTO exercises (id, workout_id, name, description, image_url, video_url, sets, reps, weight, rest_seconds, "order", is_template, muscle_group, created_date, updated_date, created_by_id, created_by, is_sample) VALUES
('69864cb8bf2cc68a3eb8d573', '69864caded508e8ad0783aa9', 'Supino Reto', '', 'https://base44.app/api/apps/6960f313c30662bfda0ff266/files/public/6960f313c30662bfda0ff266/41735747c_03_Supino-Reto.webp', 'https://www.youtube.com/watch?v=fG_03xSzT2s', '3', '12', '10', '-5', '0', 'false', 'Peito', '2026-02-06T20:19:04.869000', '2026-02-06T20:19:04.869000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6986480e35932c59807fed95', '698648061b1fe946e63cb2f2', 'Supino Reto', '', 'https://base44.app/api/apps/6960f313c30662bfda0ff266/files/public/6960f313c30662bfda0ff266/41735747c_03_Supino-Reto.webp', 'https://www.youtube.com/watch?v=fG_03xSzT2s', '3', '12', '10', '-5', '0', 'false', 'Peito', '2026-02-06T19:59:10.123000', '2026-02-06T19:59:10.123000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697376bccdbf9e2d09363c1f', '6960f586644f9db5f88afa49', 'Supino Reto', '', 'https://base44.app/api/apps/6960f313c30662bfda0ff266/files/public/6960f313c30662bfda0ff266/41735747c_03_Supino-Reto.webp', 'https://www.youtube.com/watch?v=fG_03xSzT2s', '3', '12', '10', '-5', '5', 'false', 'Peito', '2026-01-23T13:25:16.198000', '2026-01-23T13:25:16.198000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697376ac4d2196cd5e80a64c', '', 'Supino Reto', '', 'https://base44.app/api/apps/6960f313c30662bfda0ff266/files/public/6960f313c30662bfda0ff266/41735747c_03_Supino-Reto.webp', 'https://www.youtube.com/watch?v=fG_03xSzT2s', '3', '12', '10', '-5', '', 'true', 'Peito', '2026-01-23T13:25:00.273000', '2026-01-23T13:25:00.273000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa59', '6960f586644f9db5f88afa47', 'Tríceps Francês', 'Segure o halter acima da cabeça e desça atrás da nuca, estendendo os cotovelos.', 'https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?w=400', '', '3', '10-12', '12kg', '60', '4', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa58', '6960f586644f9db5f88afa47', 'Tríceps Corda', 'Na polia alta, puxe a corda para baixo estendendo os cotovelos, abrindo no final.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400', '', '4', '12-15', '20kg', '60', '3', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5f', '6960f586644f9db5f88afa49', 'Agachamento Livre', 'Desça até as coxas ficarem paralelas ao chão, mantendo as costas retas.', 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400', '', '4', '12, 10, 8, 8', '60kg', '120', '0', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5b', '6960f586644f9db5f88afa48', 'Remada Curvada', 'Incline o tronco, mantenha as costas retas e puxe a barra até o abdômen.', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=400', '', '4', '10-12', '40kg', '75', '1', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa63', '6960f586644f9db5f88afa49', 'Panturrilha em Pé', 'Eleve-se na ponta dos pés e desça controladamente.', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400', '', '4', '15-20', '50kg', '45', '4', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa61', '6960f586644f9db5f88afa49', 'Cadeira Extensora', 'Estenda as pernas completamente, contraindo o quadríceps.', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400', '', '3', '12-15', '40kg', '60', '2', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5c', '6960f586644f9db5f88afa48', 'Remada Unilateral', 'Apoie um joelho no banco, puxe o halter até a cintura.', 'https://images.unsplash.com/photo-1584466977773-e625c37cdd50?w=400', '', '3', '10-12', '20kg', '60', '2', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa56', '6960f586644f9db5f88afa47', 'Supino Inclinado com Halteres', 'No banco inclinado a 30-45°, desça os halteres até a linha dos mamilos.', 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400', '', '4', '10-12', '18kg', '75', '1', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5e', '6960f586644f9db5f88afa48', 'Rosca Martelo', 'Segure os halteres com pegada neutra e flexione alternadamente.', 'https://images.unsplash.com/photo-1583454155184-870a1f63aebc?w=400', '', '3', '12', '12kg', '60', '4', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa62', '6960f586644f9db5f88afa49', 'Mesa Flexora', 'Flexione as pernas até 90°, contraindo os posteriores.', 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400', '', '3', '12-15', '35kg', '60', '3', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa55', '6960f586644f9db5f88afa47', 'Supino Reto com Barra', 'Deite no banco, agarre a barra na largura dos ombros, desça até o peito e empurre de volta.', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400', '', '4', '12, 10, 8, 8', '40kg', '90', '0', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa57', '6960f586644f9db5f88afa47', 'Crucifixo na Máquina', 'Mantenha os cotovelos levemente flexionados e junte as mãos à frente do peito.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400', '', '3', '12-15', '25kg', '60', '2', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5a', '6960f586644f9db5f88afa48', 'Puxada Frontal', 'Puxe a barra até a altura do queixo, contraindo as escápulas.', 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400', '', '4', '12, 10, 8, 8', '50kg', '90', '0', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa5d', '6960f586644f9db5f88afa48', 'Rosca Direta', 'Com barra ou halteres, flexione os cotovelos mantendo os braços parados.', 'https://images.unsplash.com/photo-1581009137042-c552e485697a?w=400', '', '4', '10-12', '15kg', '60', '3', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f5a8644f9db5f88afa60', '6960f586644f9db5f88afa49', 'Leg Press', 'Posicione os pés na plataforma e empurre controladamente.', 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400', '', '4', '12-15', '120kg', '90', '1', 'false', '', '2026-01-09T12:33:44.711000', '2026-01-09T12:33:44.711000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false');

-- Inserindo dados da tabela workout_sessions
INSERT INTO workout_sessions (id, user_email, workout_id, workout_name, date, start_time, end_time, duration_minutes, status, exercises_completed, created_date, updated_date, created_by_id, created_by, is_sample) VALUES
('69864d6ad59566c63259ff29', 'cesar@compumais.com', '69864caded508e8ad0783aa9', 'Treiano A', '2026-02-06', '17:22', '17:22', '0', 'completed', '[{"exercise_id":"69864cb8bf2cc68a3eb8d573","exercise_name":"Supino Reto","sets_completed":3,"weight_used":"10"}]', '2026-02-06T20:22:02.831000', '2026-02-06T20:22:18.001000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('698647b6ffdc8f546f1e80eb', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-02-06', '16:57', '', '', 'cancelled', '[]', '2026-02-06T19:57:42.773000', '2026-02-06T19:58:10.780000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6984d71039c4b7aa40a162a2', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-02-05', '14:44', '', '', 'in_progress', '[]', '2026-02-05T17:44:48.379000', '2026-02-05T17:44:48.379000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6984d6168c9096fd57fa520c', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-02-05', '14:40', '', '', 'cancelled', '[]', '2026-02-05T17:40:38.455000', '2026-02-05T17:41:09.826000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697383050232384bb4e2af55', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-01-23', '11:17', '', '', 'cancelled', '[]', '2026-01-23T14:17:41.843000', '2026-01-23T14:17:57.112000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697376d109c00d15e67fa7b3', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-01-23', '10:25', '', '', 'cancelled', '[]', '2026-01-23T13:25:37.979000', '2026-01-23T13:27:16.166000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697375837722998f7c3dd6ac', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-01-23', '10:20', '10:20', '1', 'completed', '[{"exercise_id":"6960f5a8644f9db5f88afa5f","exercise_name":"Agachamento Livre","sets_completed":4,"weight_used":"60kg"},{"exercise_id":"6960f5a8644f9db5f88afa60","exercise_name":"Leg Press","sets_completed":4,"weight_used":"120kg"},{"exercise_id":"6960f5a8644f9db5f88afa61","exercise_name":"Cadeira Extensora","sets_completed":3,"weight_used":"40kg"},{"exercise_id":"6960f5a8644f9db5f88afa62","exercise_name":"Mesa Flexora","sets_completed":3,"weight_used":"35kg"},{"exercise_id":"6960f5a8644f9db5f88afa63","exercise_name":"Panturrilha em Pé","sets_completed":4,"weight_used":"50kg"}]', '2026-01-23T13:20:03.600000', '2026-01-23T13:20:38.817000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('697374899ac6ebb2dc4ce1d2', 'cesar@compumais.com', '6960f586644f9db5f88afa49', 'Treino C - Pernas', '2026-01-23', '10:15', '', '', 'cancelled', '[]', '2026-01-23T13:15:53.121000', '2026-01-23T13:16:09.505000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f78ae15fdd763183c3e7', 'cesar@compumais.com', '6960f586644f9db5f88afa47', 'Treino A - Peito e Tríceps', '2026-01-09', '09:41', '09:42', '0', 'completed', '[{"exercise_id":"6960f5a8644f9db5f88afa55","exercise_name":"Supino Reto com Barra","sets_completed":4,"weight_used":"40kg"},{"exercise_id":"6960f5a8644f9db5f88afa56","exercise_name":"Supino Inclinado com Halteres","sets_completed":4,"weight_used":"18kg"},{"exercise_id":"6960f5a8644f9db5f88afa57","exercise_name":"Crucifixo na Máquina","sets_completed":3,"weight_used":"25kg"},{"exercise_id":"6960f5a8644f9db5f88afa58","exercise_name":"Tríceps Corda","sets_completed":4,"weight_used":"20kg"},{"exercise_id":"6960f5a8644f9db5f88afa59","exercise_name":"Tríceps Francês","sets_completed":3,"weight_used":"12kg"}]', '2026-01-09T12:41:46.442000', '2026-01-09T12:42:06.947000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false'),
('6960f73321889a9c03cf566b', 'cesar@compumais.com', '6960f586644f9db5f88afa47', 'Treino A - Peito e Tríceps', '2026-01-09', '09:40', '', '', 'cancelled', '[]', '2026-01-09T12:40:19.726000', '2026-01-09T12:41:15.097000', '6960f313c30662bfda0ff267', 'cesar@compumais.com', 'false');

-- Criando índices para melhor performance
CREATE INDEX idx_workouts_student_id ON workouts(student_id);
CREATE INDEX idx_exercises_workout_id ON exercises(workout_id);
CREATE INDEX idx_workout_sessions_user_email ON workout_sessions(user_email);
CREATE INDEX idx_workout_sessions_workout_id ON workout_sessions(workout_id);
CREATE INDEX idx_workout_sessions_date ON workout_sessions(date);
CREATE INDEX idx_workout_sessions_status ON workout_sessions(status);

-- Views úteis para análise

-- View de progresso do aluno
CREATE VIEW student_progress AS
SELECT 
    s.name as student_name,
    s.email as student_email,
    ws.date,
    ws.workout_name,
    ws.status,
    ws.duration_minutes,
    ws.exercises_completed
FROM students s
JOIN workout_sessions ws ON s.email = ws.user_email
ORDER BY ws.date DESC;

-- View de estatísticas de treinos completados
CREATE VIEW workout_completion_stats AS
SELECT 
    ws.user_email,
    s.name as student_name,
    ws.workout_name,
    COUNT(CASE WHEN ws.status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN ws.status = 'cancelled' THEN 1 END) as cancelled_count,
    COUNT(CASE WHEN ws.status = 'in_progress' THEN 1 END) as in_progress_count,
    COUNT(*) as total_sessions
FROM workout_sessions ws
JOIN students s ON ws.user_email = s.email
GROUP BY ws.user_email, ws.workout_name;

-- View de exercícios mais utilizados
CREATE VIEW popular_exercises AS
SELECT 
    e.name as exercise_name,
    COUNT(*) as times_used
FROM exercises e
JOIN workout_sessions ws ON ws.workout_id = e.workout_id
WHERE ws.status = 'completed'
GROUP BY e.name
ORDER BY times_used DESC;

-- View de tendência de peso nos exercícios
CREATE VIEW exercise_weight_progression AS
SELECT 
    ws.user_email,
    ws.date,
    json_extract(value, '$.exercise_name') as exercise_name,
    json_extract(value, '$.weight_used') as weight_used,
    json_extract(value, '$.sets_completed') as sets_completed
FROM workout_sessions ws, json_each(ws.exercises_completed)
WHERE ws.status = 'completed' AND ws.exercises_completed != '[]'
ORDER BY ws.user_email, exercise_name, ws.date;
