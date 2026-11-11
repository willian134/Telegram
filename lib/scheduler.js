import cron from 'node-cron';
import db from './db.js';

let cronStarted = false;

export function initScheduler() {
  if (cronStarted) return;
  cronStarted = true;

  cron.schedule('0 22 * * *', () => {
    console.log('[CRON] Creando orden de armado automático...');
    db.prepare(`
      INSERT INTO ordenes (dispositivo, accion, origen, entregado)
      VALUES ('alarma1', 'armar', 'horario', 0)
    `).run();
    
    db.prepare(`
      INSERT INTO eventos (tipo, origen, descripcion)
      VALUES ('armado', 'horario', 'Armado automático programado')
    `).run();
  });
}
