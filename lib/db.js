import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

// Usar la variable de entorno o una carpeta local segura dentro del proyecto
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'alarma.db');

const dbDir = path.dirname(dbPath);

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
} catch (error) {
  console.error('Error al abrir SQLite en disco, usando memoria temporal:', error.message);
  db = new Database(':memory:');
}

// Inicializar tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    chat_id TEXT PRIMARY KEY,
    dispositivo TEXT DEFAULT 'alarma1',
    rol TEXT DEFAULT 'invitado'
  );

  CREATE TABLE IF NOT EXISTS ordenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispositivo TEXT NOT NULL,
    accion TEXT NOT NULL,
    origen TEXT NOT NULL,
    entregado INTEGER DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    origen TEXT NOT NULL,
    descripcion TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;