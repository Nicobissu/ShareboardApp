const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');

// Crear tabla si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      texto TEXT,
      pdf TEXT
    );
  `);
});

module.exports = db;
