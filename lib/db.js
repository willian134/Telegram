import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Si existe la variable DATABASE_PATH (Render), la usa; si no, guarda localmente en data/alarma.db
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'alarma.db');

// Crear directorio si no existe
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Configuración inicial de esquemas
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