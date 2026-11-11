import { NextResponse } from 'next/server';
import db from '../../../lib/db';

const API_KEY = process.env.ESP32_API_KEY || 'Mi casa alarma';

// Notificar a todos los usuarios registrados en Telegram
async function notificarATodos(mensaje) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const usuarios = db.prepare("SELECT chat_id FROM usuarios WHERE chat_id NOT LIKE 'ping_%'").all();
    for (const u of usuarios) {
      if (u.chat_id) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: u.chat_id,
            text: mensaje,
            parse_mode: 'Markdown'
          })
        });
      }
    }
  } catch (error) {
    console.error('Error al notificar en Telegram:', error);
  }
}

// GET: Obtener historial para la Web Dashboard
export async function GET() {
  try {
    const eventos = db.prepare('SELECT * FROM eventos ORDER BY id DESC LIMIT 50').all();
    return NextResponse.json(eventos);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener eventos' }, { status: 500 });
  }
}

// POST: Registrar eventos enviados por el ESP32
export async function POST(req) {
  try {
    const apiKey = req.headers.get('X-API-Key');
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { dispositivo, tipo, origen, descripcion } = await req.json();

    if (!tipo || !origen) {
      return NextResponse.json({ error: 'Campos "tipo" y "origen" requeridos' }, { status: 400 });
    }

    const dev = dispositivo || 'alarma1';

    // Insertar evento (fecha en hora Ecuador automáticamente)
    const stmt = db.prepare(`
      INSERT INTO eventos (tipo, origen, descripcion) 
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(tipo.toUpperCase(), origen, descripcion || '');

    // 3. Notificación masiva urgente si el tipo es DISPARO
    if (tipo.toUpperCase() === 'DISPARO') {
      await notificarATodos(
        `🚨 *¡ALERTA DE DISPARO DE ALARMA!*\n\n` +
        `📍 *Dispositivo:* ${dev}\n` +
        `⚠️ *Origen:* ${origen}\n` +
        `📝 *Detalle:* ${descripcion || 'Intrusión o sensor activado'}`
      );
    } else {
      // Notificación regular para otros eventos importantes
      await notificarATodos(
        `📌 *Nuevo Evento:* ${tipo.toUpperCase()}\n` +
        `Origen: ${origen}\n` +
        `Detalle: ${descripcion || 'Sin descripción'}`
      );
    }

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error en POST /api/eventos:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}