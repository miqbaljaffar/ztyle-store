import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'Ztyle Store',
  description: 'Belanja fashion premium di Ztyle Store.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
