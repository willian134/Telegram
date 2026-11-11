import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function POST(request) {
  try {
    const { dispositivo, accion, origen } = await request.json();

    if (!dispositivo || !accion) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // Insertar la orden para el ESP32
    const stmtOrden = db.prepare(
      'INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)'
    );
    const result = stmtOrden.run(dispositivo, accion, origen || 'Web Dashboard');

    // Registrar el evento en la bitácora
    const stmtEvento = db.prepare(
      'INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)'
    );
    stmtEvento.run('ORDEN', origen || 'Web Dashboard', `Comando ${accion} enviado a ${dispositivo}`);

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error al crear orden desde la web:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}