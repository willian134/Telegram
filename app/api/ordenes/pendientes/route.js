import { NextResponse } from 'next/server';
import db from '../../../../lib/db';

const API_KEY = process.env.ESP32_API_KEY || 'Mi casa alarma';

// 1. Obtener órdenes pendientes sin borrarlas/confirmarlas automáticamente
export async function GET(req) {
  const apiKey = req.headers.get('X-API-Key');

  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dispositivo = searchParams.get('dispositivo') || 'alarma1';

  const ordenes = db.prepare(`
    SELECT id, accion, origen 
    FROM ordenes 
    WHERE dispositivo = ? AND entregado = 0 
    ORDER BY id ASC
  `).all(dispositivo);

  return NextResponse.json({ ordenes });
}

// 2. Confirmar la entrega cuando el ESP32 (o PowerShell) procesa la orden
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