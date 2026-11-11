'use client';

import { useEffect, useState } from 'react';

export default function BitacoraPage() {
  const [eventos, setEventos] = useState([]);

  const cargarEventos = async () => {
    try {
      const res = await fetch('/api/eventos');
      const data = await res.json();
      setEventos(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    cargarEventos();
    const interval = setInterval(cargarEventos, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Bitácora de Eventos - Alarma IoT</h1>
      <table border="1" cellPadding="8" cellSpacing="0" style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>ID</th>
            <th>Tipo</th>
            <th>Origen</th>
            <th>Descripción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {eventos.map((e) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td style={{ fontWeight: 'bold' }}>{e.tipo}</td>
              <td>{e.origen}</td>
              <td>{e.descripcion || '-'}</td>
              <td>{e.fecha}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
