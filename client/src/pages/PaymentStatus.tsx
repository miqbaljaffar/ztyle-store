import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
        color: 'bg-green-50 text-green-700 border-green-100',
        icon: <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />,
        text: 'Pembayaran Berhasil',
        description: 'Pesanan Anda sedang diproses oleh tim kami.',
      };
    case 'SHIPPED':
      return {
        color: 'bg-blue-50 text-blue-700 border-blue-100',
        icon: <CheckCircleIcon className="w-12 h-12 text-blue-500 mx-auto" />,
        text: 'Sedang Dikirim',
        description: 'Pesanan Anda sedang dalam perjalanan.',
      };
    case 'DELIVERED':
      return {
        color: 'bg-green-50 text-green-700 border-green-100',
        icon: <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto" />,
        text: 'Terkirim',
        description: 'Pesanan Anda telah diterima.',
      };
    case 'CANCELLED':
      return {
        color: 'bg-red-50 text-red-700 border-red-100',
        icon: <XCircleIcon className="w-12 h-12 text-red-500 mx-auto" />,
        text: 'Dibatalkan / Kedaluwarsa',
        description: 'Pembayaran gagal atau tidak diselesaikan tepat waktu.',
      };
    case 'PENDING':
    default:
      return {
        color: 'bg-yellow-50/50 text-yellow-700 border-yellow-100',
        icon: <ClockIcon className="w-12 h-12 text-yellow-500 mx-auto animate-pulse" />,
        text: 'Menunggu Pembayaran',
        description: 'Selesaikan pembayaran Anda untuk melanjutkan pesanan.',
      };
  }
};

export default function PaymentStatus() {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningSnap, setIsOpeningSnap] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.status === 404) throw new Error('Pesanan tidak ditemukan.');
      if (!res.ok) throw new Error('Gagal mengambil data pesanan.');
      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchOrder();
    }
  }, [orderId, user, isAuthLoading, navigate, fetchOrder]);

  // Polling: Cek status pesanan setiap 5 detik jika PENDING
  useEffect(() => {
    if (!order || order.status !== 'PENDING') return;
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [order, fetchOrder]);

  // Load Midtrans Snap.js script dynamically if PENDING
  useEffect(() => {
    if (order && order.status === 'PENDING') {
      const isProd = import.meta.env.PROD;
      const snapUrl = isProd
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';
      const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '';

      if (window.snap) {
        setSnapReady(true);
        return;
      }

      const script = document.createElement('script');
      script.src = snapUrl;
      if (clientKey) {
        script.setAttribute('data-client-key', clientKey);
      }
      script.async = true;
      script.onload = () => setSnapReady(true);
      script.onerror = () => {
        console.error('Gagal memuat script Midtrans Snap.');
      };
      document.body.appendChild(script);
    }
  }, [order]);

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
      onSuccess: () => {
        toast.success('Pembayaran berhasil!');
        navigate(`/payment/success?order_id=${order.id}`);
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
  }, [order, snapReady, navigate, fetchOrder]);

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 px-4 text-center bg-red-50/50 rounded-2xl border border-red-100 p-8">
        <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-950">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Link
          to="/profile?tab=orders"
          className="btn mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-100"
        >
          Kembali ke Riwayat Pesanan
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = getStatusInfo(order.status);
  const isPending = order.status.toUpperCase() === 'PENDING';

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      {/* Header */}
      <div className="relative text-center mb-8">
        <Link
          to="/profile?tab=orders"
          className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Kembali
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Status Pesanan</h1>
        <p className="text-gray-400 text-xs mt-1">Order #ZTYLE-{order.id}</p>
      </div>

      {/* Status Card */}
      <div className={`rounded-2xl border border-gray-100 p-8 text-center mb-6 shadow-sm ${statusInfo.color}`}>
        {statusInfo.icon}
        <h2 className="text-lg font-bold mt-4 text-gray-900">{statusInfo.text}</h2>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{statusInfo.description}</p>
      </div>

      {/* Bill Details */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 mb-6">
        <h3 className="text-base font-bold text-gray-900 mb-4">Detail Tagihan</h3>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400 font-medium flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4 text-gray-400" /> Status
          </span>
          <span className={`font-bold px-3 py-1 rounded-full text-xs border ${statusInfo.color}`}>
            {statusInfo.text}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400 font-medium flex items-center gap-1.5">
            <CreditCardIcon className="w-4 h-4 text-gray-400" /> Metode Pembayaran
          </span>
          <span className="font-bold text-gray-700 capitalize">
            {order.paymentMethod === 'midtrans' ? 'Midtrans (Semua Metode)' : order.paymentMethod}
          </span>
        </div>

        <hr className="border-gray-50 my-1"/>

        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-500 flex items-center gap-1.5 text-sm">
            <CurrencyDollarIcon className="w-5 h-5 text-gray-400" /> Total Pembayaran
          </span>
          <span className="font-black text-blue-600 text-lg">
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
            className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
              isOpeningSnap || !snapReady
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
            }`}
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
          <p className="text-center text-[10px] text-gray-400 font-medium leading-relaxed">
            Token pembayaran berlaku 24 jam. Setelah itu pesanan akan dibatalkan otomatis oleh sistem.
          </p>
        </div>
      )}

      {!isPending && (
        <Link
          to="/profile?tab=orders"
          className="w-full text-center block py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-lg shadow-blue-100"
        >
          Lihat Semua Pesanan
        </Link>
      )}
    </div>
  );
}
