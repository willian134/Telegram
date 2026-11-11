import { NextResponse } from 'next/server';
import db from '../../../lib/db';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function notificarATodos(mensaje) {
  const usuarios = db.prepare('SELECT chat_id FROM usuarios').all();
  for (const u of usuarios) {
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: u.chat_id, text: mensaje })
      });
    } catch (e) {
      console.error(`Error notificando a ${u.chat_id}:`, e);
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { tipo, origen, descripcion } = body;

    const tiposValidos = ['armado', 'desarmado', 'disparo', 'pin_fallido', 'cerradura', 'rechazo'];
    const origenesValidos = ['telegram', 'sensor', 'pin', 'horario'];

    if (!tiposValidos.includes(tipo) || !origenesValidos.includes(origen)) {
      return NextResponse.json({ error: 'Tipo u origen inválido' }, { status: 400 });
    }

    db.prepare(`
      INSERT INTO eventos (tipo, origen, descripcion)
      VALUES (?, ?, ?)
    `).run(tipo, origen, descripcion || null);

    if (tipo === 'disparo') {
      await notificarATodos('🚨 ¡ALERTA DE DISPARO! La alarma se ha activado.');
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const eventos = db.prepare('SELECT * FROM eventos ORDER BY fecha DESC LIMIT 50').all();
  return NextResponse.json(eventos);
}
