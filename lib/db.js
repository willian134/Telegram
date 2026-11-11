import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

// Directorio y base de datos persistente en /data o memoria local
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

// Inicializar esquemas de base de datos con hora de Ecuador (-5 horas)
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
    fecha DATETIME DEFAULT (datetime('now', '-5 hours'))
  );

  CREATE TABLE IF NOT EXISTS eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT NOT NULL,
    origen TEXT NOT NULL,
    descripcion TEXT,
    fecha DATETIME DEFAULT (datetime('now', '-5 hours'))
  );
`);

// 4. Asegurar el registro de tu administrador (chat_id: 9105358410)
try {
  db.prepare(`
    INSERT INTO usuarios (chat_id, dispositivo, rol) 
    VALUES ('9105358410', 'alarma1', 'administrador') 
    ON CONFLICT(chat_id) DO UPDATE SET rol = 'administrador'
  `).run();
} catch (e) {
  console.error('Error al registrar administrador base:', e.message);
}

export default db;