import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db;

// Directorio y base de datos persistente
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

// Registro automático de usuarios persistentes (Evita pérdidas tras reiniciar en Render)
try {
  const insertUser = db.prepare(`
    INSERT INTO usuarios (chat_id, dispositivo, rol) 
    VALUES (?, 'alarma1', ?) 
    ON CONFLICT(chat_id) DO UPDATE SET rol = excluded.rol
  `);

  // 1. Administrador principal
  insertUser.run('9105358410', 'administrador');
  
  // 2. Usuario Invitado (para pruebas de restricción en /abrir)
  insertUser.run('123456789', 'invitado');
} catch (e) {
  console.error('Error al insertar usuarios base:', e.message);
}

export default db;