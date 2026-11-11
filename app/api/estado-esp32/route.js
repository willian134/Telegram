import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export async function GET() {
  try {
    const row = db.prepare("SELECT rol FROM usuarios WHERE chat_id = 'ping_alarma1'").get();

    if (!row || !row.rol) {
      return NextResponse.json({ online: false });
    }

    // Si la última consulta del ESP32 fue hace menos de 15 segundos, está en línea
    const ultimaConexion = new Date(row.rol + ' Z').getTime();
    const ahora = new Date().getTime();
    const haceSegundos = (ahora - ultimaConexion) / 1000;

    return NextResponse.json({ online: haceSegundos < 15 });
  } catch (error) {
    return NextResponse.json({ online: false });
  }
}