import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

const API_KEY = process.env.ESP32_API_KEY || 'Mi casa alarma';

export async function GET(req) {
  const apiKey = req.headers.get('X-API-Key');

  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dispositivo = searchParams.get('dispositivo') || 'alarma1';

  // REGISTRAR PING DEL ESP32 PARA EL ESTADO EN LÍNEA
  try {
    db.prepare(`
      INSERT INTO usuarios (chat_id, dispositivo, rol) 
      VALUES (?, ?, datetime('now')) 
      ON CONFLICT(chat_id) DO UPDATE SET rol = datetime('now')
    `).run(`ping_${dispositivo}`, dispositivo);
  } catch (e) {
    console.error('Error al guardar ping:', e);
  }

  const ordenes = db.prepare(`
    SELECT id, accion, origen 
    FROM ordenes 
    WHERE dispositivo = ? AND entregado = 0 
    ORDER BY id ASC
  `).all(dispositivo);

  return NextResponse.json({ ordenes });
}

export async function POST(req) {
  const apiKey = req.headers.get('X-API-Key');

  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 });
  }

  db.prepare('UPDATE ordenes SET entregado = 1 WHERE id = ?').run(id);

  return NextResponse.json({ status: 'ok', mensaje: `Orden ${id} confirmada` });
}