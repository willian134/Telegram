export const metadata = {
  title: 'Alarma IoT Backend',
  description: 'Sistema de alarma IoT con Next.js y Telegram',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
