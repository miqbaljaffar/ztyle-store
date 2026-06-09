import { poppins } from './ui/fonts';
import Providers from './providers';
import './globals.css';
import { Toaster } from 'sonner'; 

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-center" richColors /> 
        </Providers>
      </body>
    </html>
  );
}