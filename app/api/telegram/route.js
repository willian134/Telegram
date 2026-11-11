import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { initScheduler } from '../../../lib/scheduler';

initScheduler();

// Credenciales directas para evitar fallos de lectura de variables de entorno
const TELEGRAM_TOKEN = '9210604722:AAHuIff1HfBfpINr8LdH18aibLHmmkbUlAE';
const SECRET_TOKEN = 'mi_secreto_webhook_alarma_2026';

async function responderTelegram(chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text })
    });
  } catch (err) {
    console.error('Error al responder en Telegram:', err);
  }
}

export async function POST(req) {
  const headerSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (headerSecret !== SECRET_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await req.json();
  console.log('Mensaje recibido en Webhook:', JSON.stringify(body));

  const message = body.message;
  if (!message || !message.text) {
    return NextResponse.json({ status: 'ok' });
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const nombre = message.from.first_name || 'Usuario';

  // Buscar usuario
  let usuario = db.prepare('SELECT * FROM usuarios WHERE chat_id = ?').get(chatId);

  // Si no existe, crearlo automáticamente
  if (!usuario) {
    const countResult = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    const totalUsuarios = countResult ? countResult.count : 0;
    const rolInicial = totalUsuarios === 0 ? 'administrador' : 'invitado';

    try {
      db.prepare('INSERT INTO usuarios (chat_id, dispositivo, rol) VALUES (?, ?, ?)').run(chatId, 'alarma1', rolInicial);
    } catch (e) {
      // Fallback si la tabla usa columnas distintas
      console.log('Error insertando usuario, intentando fallback:', e.message);
    }
    usuario = { chat_id: chatId, dispositivo: 'alarma1', rol: rolInicial };
  }

  // Verificar si es admin
  const esAdmin = usuario.rol === 'administrador' || usuario.rol === 'admin';

  // Comando /start
  if (text === '/start') {
    await responderTelegram(
      chatId, 
      `Hola ${nombre}.\nTu rol actual es: ${usuario.rol}.\n\nComandos disponibles:\n/estado\n/historial\n/armar\n/desarmar\n/abrir`
    );
    return NextResponse.json({ status: 'ok' });
  }

  // Comando /estado
  if (text === '/estado') {
    const ultimo = db.prepare(`
      SELECT tipo FROM eventos 
      WHERE tipo IN ('armado', 'desarmado', 'disparo') 
      ORDER BY fecha DESC LIMIT 1
    `).get();
    
    const estado = ultimo ? ultimo.tipo.toUpperCase() : 'DESCONOCIDO (SIN EVENTOS)';
    await responderTelegram(chatId, `Estado del sistema: ${estado}`);
    return NextResponse.json({ status: 'ok' });
  }

  // Comando /historial
  if (text === '/historial') {
    const eventos = db.prepare('SELECT tipo, origen, fecha FROM eventos ORDER BY fecha DESC LIMIT 10').all();
    if (eventos.length === 0) {
      await responderTelegram(chatId, 'El historial está vacío.');
    } else {
      const listado = eventos.map(e => `• [${e.fecha}] ${e.tipo} (${e.origen})`).join('\n');
      await responderTelegram(chatId, `Últimos 10 eventos:\n${listado}`);
    }
    return NextResponse.json({ status: 'ok' });
  }

  // Comandos de control
  if (['/armar', '/desarmar', '/abrir', '/activar'].includes(text)) {
    if (!esAdmin) {
      db.prepare(`
        INSERT INTO eventos (tipo, origen, descripcion) 
        VALUES ('rechazo', 'telegram', ?)
      `).run(`Intento no autorizado de ${text}`);
      
      await responderTelegram(chatId, 'No estás autorizado para enviar esta orden.');
      return NextResponse.json({ status: 'ok' });
    }

    const accionMap = { 
      '/armar': 'armar', 
      '/activar': 'armar', 
      '/desarmar': 'desarmar', 
      '/abrir': 'abrir' 
    };
    const accion = accionMap[text];

    db.prepare(`
      INSERT INTO ordenes (dispositivo, accion, origen, entregado) 
      VALUES ('alarma1', ?, 'telegram', 0)
    `).run(accion);

    await responderTelegram(chatId, `Orden "${accion}" guardada. El ESP32 la ejecutará al conectarse.`);
    return NextResponse.json({ status: 'ok' });
  }

  return NextResponse.json({ status: 'ok' });
}