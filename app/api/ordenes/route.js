import { NextResponse } from 'next/server';
import db from '../../../lib/db';

async function notificarTelegram(mensaje) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const usuarios = db.prepare("SELECT chat_id FROM usuarios WHERE chat_id NOT LIKE 'ping_%'").all();
    for (const usuario of usuarios) {
      if (usuario.chat_id) {
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
    }
  } catch (error) {
    console.error('Error al notificar Telegram:', error);
  }
}

export async function POST(request) {
  try {
    const { dispositivo, accion, origen } = await request.json();

    if (!dispositivo || !accion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // 1. Guardar orden pendiente para el ESP32
    const stmtOrden = db.prepare(
      'INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)'
    );
    const result = stmtOrden.run(dispositivo, accion, origen || 'Web Dashboard');

    // 2. Registrar el evento en la bitácora
    const stmtEvento = db.prepare(
      'INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)'
    );
    const desc = `Comando ${accion.toUpperCase()} enviado a ${dispositivo}`;
    stmtEvento.run('ORDEN', origen || 'Web Dashboard', desc);

    // 3. Notificar a Telegram
    await notificarTelegram(`🌐 *Acción desde Web Dashboard*\n${desc}`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error al crear orden desde la web:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}