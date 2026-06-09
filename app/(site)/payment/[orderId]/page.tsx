'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Script from 'next/script';
import { toast } from 'sonner';
import {
  ArrowLeftIcon,
  ClockIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface OrderStatus {
  id: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  snapToken: string | null;
  midtransOrderId: string | null;
}

const getStatusInfo = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />,
        text: 'Pembayaran Berhasil',
        description: 'Pesanan Anda sedang diproses oleh tim kami.',
      };
    case 'SHIPPED':
      return {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <CheckCircleIcon className="w-12 h-12 text-blue-500 mx-auto" />,
        text: 'Sedang Dikirim',
        description: 'Pesanan Anda sedang dalam perjalanan.',
      };
    case 'DELIVERED':
      return {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />,
        text: 'Terkirim',
        description: 'Pesanan Anda telah diterima.',
      };
    case 'CANCELLED':
      return {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircleIcon className="w-12 h-12 text-red-500 mx-auto" />,
        text: 'Dibatalkan / Kedaluwarsa',
        description: 'Pembayaran gagal atau tidak diselesaikan tepat waktu.',
      };
    case 'PENDING':
    default:
      return {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto" />,
        text: 'Menunggu Pembayaran',
        description: 'Selesaikan pembayaran Anda untuk melanjutkan pesanan.',
      };
  }
};

export default function PaymentStatusPage() {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningSnap, setIsOpeningSnap] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { orderId } = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 404) throw new Error('Pesanan tidak ditemukan.');
      if (!res.ok) throw new Error('Gagal mengambil data pesanan.');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (sessionStatus === 'authenticated') {
      fetchOrder();
    }
  }, [orderId, sessionStatus, router, fetchOrder]);

  // Polling: cek status order setiap 5 detik jika masih PENDING
  useEffect(() => {
    if (!order || order.status !== 'PENDING') return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  const handlePayNow = useCallback(() => {
    if (!order?.snapToken) {
      toast.error('Token pembayaran tidak ditemukan. Hubungi support.');
      return;
    }
    if (!snapReady) {
      toast.error('Sistem pembayaran belum siap, coba lagi sebentar.');
      return;
    }

    setIsOpeningSnap(true);

    window.snap.pay(order.snapToken, {
      onSuccess: (result) => {
        toast.success('Pembayaran berhasil!');
        router.push(`/payment/success?order_id=${order.id}`);
      },
      onPending: () => {
        toast.info('Pembayaran sedang diproses.');
        fetchOrder(); // refresh status
      },
      onError: () => {
        toast.error('Pembayaran gagal.');
        setIsOpeningSnap(false);
        fetchOrder();
      },
      onClose: () => {
        setIsOpeningSnap(false);
        fetchOrder(); // refresh status saat popup ditutup
      },
    });
  }, [order, snapReady, router, fetchOrder]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) return (
    <div className="card text-center text-red-600 bg-red-50 max-w-lg mx-auto mt-10 p-8">
      <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
      <p className="mt-2">{error}</p>
      <Link href="/profile/orders" className="btn mt-6 inline-block">
        Kembali ke Riwayat Pesanan
      </Link>
    </div>
  );

  if (!order) return null;

  const statusInfo = getStatusInfo(order.status);
  const isPending = order.status.toUpperCase() === 'PENDING';

  return (
    <>
      {/* Load Midtrans Snap.js jika order masih PENDING */}
      {isPending && (
        <Script
          src={
            process.env.NODE_ENV === 'production'
              ? 'https://app.midtrans.com/snap/snap.js'
              : 'https://app.sandbox.midtrans.com/snap/snap.js'
          }
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="afterInteractive"
          onLoad={() => setSnapReady(true)}
        />
      )}

      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="relative text-center mb-8">
          <Link
            href="/profile/orders"
            className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Kembali
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Status Pesanan</h1>
          <p className="text-gray-500 text-sm mt-1">Order #{order.id}</p>
        </div>

        {/* Status Card */}
        <div className={`rounded-2xl border-2 p-8 text-center mb-6 ${statusInfo.color}`}>
          {statusInfo.icon}
          <h2 className="text-xl font-bold mt-3">{statusInfo.text}</h2>
          <p className="text-sm mt-1">{statusInfo.description}</p>
        </div>

        {/* Detail Tagihan */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-3 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Detail Tagihan</h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />Status
            </span>
            <span className={`font-bold px-3 py-1 rounded-full text-xs border ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4" />Metode Pembayaran
            </span>
            <span className="font-semibold text-gray-800 capitalize">
              {order.paymentMethod === 'midtrans' ? 'Midtrans (Semua Metode)' : order.paymentMethod}
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-medium text-gray-600 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5" />Total Pembayaran
            </span>
            <span className="font-bold text-blue-600 text-lg">
              Rp{order.totalAmount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {isPending && (
          <div className="space-y-3">
            <button
              onClick={handlePayNow}
              disabled={isOpeningSnap || !snapReady}
              className="btn w-full text-lg py-3"
            >
              {isOpeningSnap ? (
                <span className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  Membuka halaman pembayaran...
                </span>
              ) : (
                'Bayar Sekarang'
              )}
            </button>
            <p className="text-center text-xs text-gray-400">
              Token pembayaran berlaku 24 jam. Setelah itu pesanan akan dibatalkan otomatis.
            </p>
          </div>
        )}

        {!isPending && (
          <Link href="/profile/orders" className="btn w-full text-center block py-3">
            Lihat Semua Pesanan
          </Link>
        )}
      </div>
    </>
  );
}