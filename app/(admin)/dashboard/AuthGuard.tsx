'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardSkeleton } from '@/app/ui/skeletons';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // useEffect akan memantau perubahan status sesi
  useEffect(() => {
    // Jika sesi sudah selesai loading dan ternyata pengguna tidak terautentikasi
    // atau rolenya bukan ADMIN, paksa redirect.
    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.replace('/');
    }
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [session, status, router]);

  // Saat sesi sedang diperiksa (loading), tampilkan skeleton/loader.
  // INI MENCEGAH "FLASH" ATAU "GLIMPSE" DARI UI DASHBOARD ASLI.
  if (status === 'loading') {
    return <DashboardSkeleton />;
  }

  // Jika sesi sudah terverifikasi sebagai ADMIN, tampilkan konten dashboard.
  if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
    return <>{children}</>;
  }

  // Fallback, jika ada kasus lain, tampilkan loader.
  return <DashboardSkeleton />;
}