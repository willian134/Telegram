import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'alarma.db');

// Garantizar que la carpeta exista antes de instanciar SQLite
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.error(`Error al crear directorio ${dbDir}:`, err);
  }
}

try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL'); // Optimiza lecturas/escrituras concurrentes
} catch (error) {
  console.error('Error al abrir la base de datos SQLite:', error);
  db = new Database(':memory:');
}

// Inicialización de esquema
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