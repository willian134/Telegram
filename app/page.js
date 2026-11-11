'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Cargar historial de eventos
  const cargarEventos = async () => {
    try {
      const res = await fetch('/api/eventos');
      const data = await res.json();
      if (Array.isArray(data)) setEventos(data);
    } catch (err) {
      console.error('Error al cargar eventos:', err);
    }
  };

  useEffect(() => {
    cargarEventos();
    const interval = setInterval(cargarEventos, 5000); // Actualiza cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  // Enviar orden directa desde la web al ESP32
  const enviarOrden = async (accion) => {
    setLoading(true);
    setMensaje('');
    try {
      const res = await fetch('/api/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dispositivo: 'alarma1',
          accion: accion,
          origen: 'Web Dashboard'
        })
      });
      if (res.ok) {
        setMensaje(`Comando "${accion.toUpperCase()}" enviado con éxito`);
        cargarEventos();
      } else {
        setMensaje('Error al enviar la orden');
      }
    } catch (err) {
      setMensaje('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🚨 Panel de Control - Alarma IoT</h1>
        <span style={styles.badge}>Sistema en Línea</span>
      </header>

      {/* Tarjetas de Control */}
      <section style={styles.section}>
        <h2 style={styles.subtitle}>Acciones Rápidas</h2>
        <div style={styles.buttonGroup}>
          <button 
            onClick={() => enviarOrden('armar')} 
            disabled={loading}
            style={{ ...styles.btn, backgroundColor: '#e53e3e' }}
          >
            🔒 Armar Alarma
          </button>
          <button 
            onClick={() => enviarOrden('desarmar')} 
            disabled={loading}
            style={{ ...styles.btn, backgroundColor: '#38a169' }}
          >
            🔓 Desarmar Alarma
          </button>
          <button 
            onClick={() => enviarOrden('abrir')} 
            disabled={loading}
            style={{ ...styles.btn, backgroundColor: '#3182ce' }}
          >
            ⚡ Pulso Abrir (Relé)
          </button>
        </div>
        {mensaje && <p style={styles.alert}>{mensaje}</p>}
      </section>

      {/* Bitácora de Eventos */}
      <section style={styles.section}>
        <div style={styles.tableHeader}>
          <h2 style={styles.subtitle}>Bitácora de Eventos en Tiempo Real</h2>
          <button onClick={cargarEventos} style={styles.btnRefresh}>🔄 Actualizar</button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Tipo</th>
                <th style={styles.th}>Origen</th>
                <th style={styles.th}>Descripción</th>
                <th style={styles.th}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {eventos.length === 0 ? (
                <tr>
                  <td colSpan="5" style={styles.tdEmpty}>No hay eventos registrados aún.</td>
                </tr>
              ) : (
                eventos.map((evt) => (
                  <tr key={evt.id} style={styles.tr}>
                    <td style={styles.td}>{evt.id}</td>
                    <td style={styles.td}>
                      <span style={getTipoStyle(evt.tipo)}>{evt.tipo}</span>
                    </td>
                    <td style={styles.td}>{evt.origen}</td>
                    <td style={styles.td}>{evt.descripcion || '-'}</td>
                    <td style={styles.td}>{new Date(evt.fecha).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

// Estilos visuales del Dashboard Oscuro
const getTipoStyle = (tipo) => {
  const base = { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' };
  if (tipo === 'ORDEN') return { ...base, backgroundColor: '#2b6cb0', color: '#fff' };
  if (tipo === 'ALERTA') return { ...base, backgroundColor: '#c53030', color: '#fff' };
  return { ...base, backgroundColor: '#4a5568', color: '#fff' };
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '30px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
    paddingBottom: '20px',
    marginBottom: '30px'
  },
  title: { fontSize: '24px', fontWeight: 'bold', margin: 0 },
  badge: {
    backgroundColor: '#22c55e20',
    color: '#4ade80',
    border: '1px solid #4ade80',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px'
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)'
  },
  subtitle: { fontSize: '18px', margin: '0 0 16px 0', color: '#cbd5e1' },
  buttonGroup: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  btn: {
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  },
  alert: { marginTop: '16px', color: '#38bdf8', fontSize: '14px', margin: '16px 0 0 0' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  btnRefresh: {
    backgroundColor: '#334155',
    color: '#cbd5e1',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  thRow: { borderBottom: '2px solid #334155' },
  th: { padding: '12px', color: '#94a3b8', fontSize: '14px' },
  tr: { borderBottom: '1px solid #334155' },
  td: { padding: '12px', fontSize: '14px', color: '#e2e8f0' },
  tdEmpty: { padding: '24px', textAlign: 'center', color: '#64748b' }
};