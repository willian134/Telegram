import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Backend Alarma IoT</h1>
      <p>Servidor activo.</p>
      <Link href="/bitacora">Ver Bitácora de Eventos</Link>
    </main>
  );
}
