import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance = null;

function getDatabase() {
  if (dbInstance) return dbInstance;

  // Si estamos en Render usa DATABASE_PATH, si no, usa la carpeta local
  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'alarma.db');

  try {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    dbInstance = new Database(dbPath);

    // Inicializar tablas si no existen
    dbInstance.exec(`
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
  } catch (error) {
    console.error('Error al inicializar la base de datos SQLite:', error);
    // Retornar base de datos en memoria como respaldo durante el build si falla la ruta física
    dbInstance = new Database(':memory:');
  }

  return dbInstance;
}

const db = getDatabase();

export default db;