import { NextResponse } from 'next/server';
import db from '../../../lib/db';

const TELEGRAM_SECRET = process.env.TELEGRAM_SECRET_TOKEN || 'MiSecretoAlarma123';
const API_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function enviarMensajeTelegram(chatId, mensaje) {
  if (!API_TOKEN) return;
  try {
    await fetch(`https://api.telegram.org/bot${API_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensaje,
        parse_mode: 'Markdown'
      })
    });
  } catch (error) {
    console.error('Error al enviar respuesta a Telegram:', error);
  }
}

export async function POST(req) {
  try {
    // 1. Validar la cabecera del Secret Token de Telegram
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    
    if (secretHeader !== TELEGRAM_SECRET) {
      console.warn('Intento de acceso al webhook con token secreto inválido.');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();

    // Procesar mensajes entrantes de Telegram
    if (body.message && body.message.text) {
      const chatId = String(body.message.chat.id);
      const text = body.message.text.trim();

      // Verificar o registrar al usuario si interactúa dinámicamente
      let usuario = db.prepare('SELECT rol FROM usuarios WHERE chat_id = ?').get(chatId);
      
      if (!usuario) {
        db.prepare(`
          INSERT INTO usuarios (chat_id, dispositivo, rol) 
          VALUES (?, 'alarma1', 'invitado')
        `).run(chatId);
        usuario = { rol: 'invitado' };
      }

      const rol = usuario.rol;

      // Comando: /start
      if (text === '/start') {
        await enviarMensajeTelegram(
          chatId,
          `👋 *¡Hola! Sistema de Alarma IoT Activo*\n\n` +
          `👤 *Tu rol actual:* \`${rol}\`\n\n` +
          `📋 *Comandos disponibles:*\n` +
          `/estado - Consultar el estado del sistema\n` +
          `/historial - Ver últimos eventos\n` +
          `/armar - Armar el sistema\n` +
          `/desarmar - Desarmar el sistema\n` +
          `/abrir - Abrir cerradura (Solo Admin)`
        );
        return NextResponse.json({ status: 'ok' });
      }

      // Comando: /estado
      if (text === '/estado') {
        const ultimoEvento = db.prepare('SELECT * FROM eventos ORDER BY id DESC LIMIT 1').get();
        const descripcion = ultimoEvento ? `${ultimoEvento.tipo} (${ultimoEvento.descripcion})` : 'DESCONOCIDO (SIN EVENTOS)';
        
        await enviarMensajeTelegram(chatId, `📊 *Estado del sistema:* ${descripcion}`);
        return NextResponse.json({ status: 'ok' });
      }

      // Comando: /historial
      if (text === '/historial') {
        const eventos = db.prepare('SELECT * FROM eventos ORDER BY id DESC LIMIT 5').all();
        let msj = '📜 *Últimos 5 eventos:*\n\n';
        eventos.forEach(e => {
          msj += `• *${e.tipo}* - ${e.descripcion} (${e.fecha})\n`;
        });
        await enviarMensajeTelegram(chatId, msj);
        return NextResponse.json({ status: 'ok' });
      }

      // Comando: /armar
      if (text === '/armar') {
        db.prepare('INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)').run('alarma1', 'ARMAR', `Telegram (${rol})`);
        db.prepare('INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)').run('ORDEN', `Telegram (${rol})`, 'Orden ARMAR recibida por Telegram');
        
        await enviarMensajeTelegram(chatId, '🔒 Orden *"ARMAR"* guardada. El ESP32 la ejecutará al conectarse.');
        return NextResponse.json({ status: 'ok' });
      }

      // Comando: /desarmar
      if (text === '/desarmar') {
        db.prepare('INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)').run('alarma1', 'DESARMAR', `Telegram (${rol})`);
        db.prepare('INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)').run('ORDEN', `Telegram (${rol})`, 'Orden DESARMAR recibida por Telegram');
        
        await enviarMensajeTelegram(chatId, '🔓 Orden *"DESARMAR"* guardada. El ESP32 la ejecutará al conectarse.');
        return NextResponse.json({ status: 'ok' });
      }

      // Comando: /abrir (Restringido por ROL)
      if (text === '/abrir') {
        if (rol !== 'administrador') {
          await enviarMensajeTelegram(
            chatId, 
            '⛔ *Acceso Denegado*\nTu rol actual (`invitado`) no tiene permisos para accionar la cerradura.'
          );
          return NextResponse.json({ status: 'ok' });
        }

        db.prepare('INSERT INTO ordenes (dispositivo, accion, origen) VALUES (?, ?, ?)').run('alarma1', 'ABRIR', `Telegram (${rol})`);
        db.prepare('INSERT INTO eventos (tipo, origen, descripcion) VALUES (?, ?, ?)').run('ORDEN', `Telegram (${rol})`, 'Pulso de ABRIR generado desde Telegram por Admin');
        
        await enviarMensajeTelegram(chatId, '⚡ Pulso de *"APERTURA"* enviado a la cerradura.');
        return NextResponse.json({ status: 'ok' });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Error en POST /api/telegram:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}