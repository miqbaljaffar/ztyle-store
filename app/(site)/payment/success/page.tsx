'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircleIcon, ShoppingBagIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const orderId = searchParams.get('order_id');
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // Auto-redirect ke riwayat pesanan setelah 8 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/profile/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
          <div className="relative bg-green-100 rounded-full p-6">
            <CheckCircleIcon className="w-16 h-16 text-green-500" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 mb-6">
          Terima kasih telah berbelanja di <span className="font-semibold text-blue-600">Ztyle</span>.
          Pesanan Anda sedang kami proses.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
            <p className="text-sm text-gray-500">Nomor Pesanan</p>
            <p className="text-xl font-bold text-gray-800 mt-1">#{orderId}</p>
          </div>
        )}

        <div className="bg-blue-50 rounded-xl p-4 mb-8 border border-blue-100 text-sm text-blue-700">
          <p>Konfirmasi pesanan akan dikirim ke email Anda.</p>
          <p className="mt-1">Estimasi pengiriman: <strong>2-4 hari kerja</strong></p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile/orders"
            className="btn flex-1 flex items-center justify-center gap-2 py-3"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Lihat Pesanan
          </Link>
          <Link
            href="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            <HomeIcon className="w-5 h-5" />
            Belanja Lagi
          </Link>
        </div>

        {/* Auto redirect notice */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-xs text-gray-400">
          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
          <span>Otomatis ke riwayat pesanan dalam {countdown} detik...</span>
        </div>
      </div>
    </div>
  );
}
