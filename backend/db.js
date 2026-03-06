const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Caminho do arquivo do banco
const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'academia.db');

// Caminho do script SQL de criação/população
const sqlPath = path.join(__dirname, '..', 'src', 'base', 'banco.sql');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const isFirstRun = !fs.existsSync(dbPath);
const db = new Database(dbPath);

if (isFirstRun) {
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Arquivo SQL não encontrado em: ${sqlPath}`);
  }

  const initSql = fs.readFileSync(sqlPath, 'utf8');
  db.exec(initSql);
}

module.exports = db;

