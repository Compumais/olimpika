const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

function generateId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

function createCrudRoutes({
  basePath,
  tableName,
  idColumn = 'id',
  allowedFilters = []
}) {
  // Listar com filtros opcionais via query string
  app.get(`/${basePath}`, (req, res) => {
    try {
      const whereClauses = [];
      const params = [];

      Object.entries(req.query).forEach(([key, value]) => {
        if (allowedFilters.includes(key)) {
          whereClauses.push(`${key} = ?`);
          params.push(value);
        }
      });

      const sql =
        `SELECT * FROM ${tableName}` +
        (whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '');

      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao listar registros' });
    }
  });

  // Obter por ID
  app.get(`/${basePath}/:${idColumn}`, (req, res) => {
    try {
      const stmt = db.prepare(
        `SELECT * FROM ${tableName} WHERE ${idColumn} = ?`
      );
      const row = stmt.get(req.params[idColumn]);

      if (!row) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      res.json(row);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao buscar registro' });
    }
  });

  // Criar
  app.post(`/${basePath}`, (req, res) => {
    try {
      const data = { ...(req.body || {}) };

      if (!data[idColumn]) {
        data[idColumn] = generateId();
      }

      const cols = Object.keys(data);
      if (!cols.length) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const placeholders = cols.map(() => '?').join(',');
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders})`
      );
      stmt.run(...cols.map((c) => data[c]));

      const created = db
        .prepare(`SELECT * FROM ${tableName} WHERE ${idColumn} = ?`)
        .get(data[idColumn]);

      res.status(201).json(created);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar registro' });
    }
  });

  // Atualizar
  app.put(`/${basePath}/:${idColumn}`, (req, res) => {
    try {
      const updates = { ...(req.body || {}) };
      const cols = Object.keys(updates);

      if (!cols.length) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const setClause = cols.map((c) => `${c} = ?`).join(', ');
      const stmt = db.prepare(
        `UPDATE ${tableName} SET ${setClause} WHERE ${idColumn} = ?`
      );
      const result = stmt.run(
        ...cols.map((c) => updates[c]),
        req.params[idColumn]
      );

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      const updated = db
        .prepare(`SELECT * FROM ${tableName} WHERE ${idColumn} = ?`)
        .get(req.params[idColumn]);

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao atualizar registro' });
    }
  });

  // Deletar
  app.delete(`/${basePath}/:${idColumn}`, (req, res) => {
    try {
      const stmt = db.prepare(
        `DELETE FROM ${tableName} WHERE ${idColumn} = ?`
      );
      const result = stmt.run(req.params[idColumn]);

      if (result.changes === 0) {
        return res.status(404).json({ error: 'Registro não encontrado' });
      }

      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao remover registro' });
    }
  });
}

// Healthcheck simples
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rotas para cada tabela principal
createCrudRoutes({
  basePath: 'students',
  tableName: 'students',
  idColumn: 'id',
  allowedFilters: ['email', 'personal_trainer_email', 'name']
});

createCrudRoutes({
  basePath: 'workouts',
  tableName: 'workouts',
  idColumn: 'id',
  allowedFilters: ['student_id', 'name', 'short_name']
});

createCrudRoutes({
  basePath: 'exercises',
  tableName: 'exercises',
  idColumn: 'id',
  allowedFilters: ['workout_id', 'name', 'muscle_group', 'is_template']
});

createCrudRoutes({
  basePath: 'workout-sessions',
  tableName: 'workout_sessions',
  idColumn: 'id',
  allowedFilters: ['user_email', 'workout_id', 'date', 'status']
});

app.listen(PORT, () => {
  console.log(`API Academia rodando em http://localhost:${PORT}`);
});

