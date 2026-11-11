import { NextResponse } from 'next/server';
import path from 'path';

// Importación segura independiente de la profundidad del archivo
const dbPath = path.resolve(process.cwd(), 'lib', 'db.js');
const db = require(dbPath).default || require(dbPath);

async function notificarTelegram(mensaje) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const usuario = db.prepare("SELECT chat_id FROM usuarios WHERE chat_id NOT LIKE 'ping_%' LIMIT 1").get();
    
    if (usuario && usuario.chat_id) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: usuario.chat_id,
          text: mensaje,
          parse_mode: 'Markdown'
        })
      });
    }
  } catch (error) {
    console.error('Error al enviar notificacion a Telegram:', error);
  }
}

export async function POST(request) {
  try {
    const { dispositivo, accion, origen } = await request.json();

    if (!dispositivo || !accion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const stmtOrden = db.prepare(
      'INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)'
    );
    const result = stmtOrden.run(dispositivo, accion, origen || 'Web Dashboard');

    const stmtEvento = db.prepare(
      'INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)'
    );
    const desc = `Comando ${accion.toUpperCase()} enviado a ${dispositivo}`;
    stmtEvento.run('ORDEN', origen || 'Web Dashboard', desc);

    await notificarTelegram(`🌐 *Alerta Web Dashboard*\n${desc}`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error al crear orden desde la web:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}