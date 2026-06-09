import { getToken } from 'next-auth/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Daftar rute yang HANYA bisa diakses oleh ADMIN
  const adminRoutes = ['/dashboard'];

  // Daftar rute yang HANYA bisa diakses oleh CUSTOMER yang sudah login
  // ---->> TAMBAHKAN '/products' DI SINI <<----
  const customerProtectedRoutes = ['/profile', '/checkout', '/payment', '/products'];

  // --- ATURAN 1: Melindungi Rute Admin ---
  // Jika mencoba akses rute admin...
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    // ...tapi tidak punya token atau bukan admin, tendang ke halaman utama.
    if (!token || token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // --- ATURAN 2: Melindungi Rute Customer ---
  // Jika mencoba akses rute customer...
  if (customerProtectedRoutes.some(route => pathname.startsWith(route))) {
    // ...tapi belum login, tendang ke halaman login.
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=' + pathname, request.url));
    }
    // ...DAN JIKA yang akses adalah ADMIN, tendang kembali ke dashboard.
    if (token.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // --- ATURAN 3: Mencegah Akses ke Halaman Login/Register Jika Sudah Login ---
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    // Arahkan berdasarkan role
    const url = token.role === 'ADMIN' ? '/dashboard' : '/';
    return NextResponse.redirect(new URL(url, request.url));
  }

  // Jika semua aturan lolos, lanjutkan request.
  return NextResponse.next();
}

// Konfigurasi matcher tetap sama
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|favicon.ico).*)',
  ],
};