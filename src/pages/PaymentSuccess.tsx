import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CheckCircleIcon, ShoppingBagIcon, HomeIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuthStore();
  const orderId = searchParams.get('order_id');
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // Auto-redirect to order history after 8 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/profile?tab=orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500" />
      </div>
    );
  }

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

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Terima kasih telah berbelanja di <span className="font-semibold text-blue-600">Ztyle</span>.
          Pesanan Anda sedang kami proses.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Nomor Pesanan</p>
            <p className="text-2xl font-black text-gray-900 mt-1">#ZTYLE-{orderId}</p>
          </div>
        )}

        <div className="bg-blue-50/50 rounded-2xl p-4 mb-8 border border-blue-100 text-xs text-blue-700 leading-relaxed">
          <p className="font-bold">Konfirmasi pesanan akan dikirim ke email Anda.</p>
          <p className="mt-1">Estimasi pengiriman: <strong>2-4 hari kerja</strong></p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/profile?tab=orders"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-100 text-sm"
          >
            <ShoppingBagIcon className="w-5 h-5" />
            Lihat Pesanan
          </Link>
          <Link
            to="/products"
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:border-gray-300 hover:text-blue-600 transition-colors text-sm"
          >
            <HomeIcon className="w-5 h-5" />
            Belanja Lagi
          </Link>
        </div>

        {/* Auto redirect notice */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-gray-400 font-semibold">
          <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-gray-400" />
          <span>Mengarahkan ke riwayat pesanan dalam {countdown} detik...</span>
        </div>
      </div>
    </div>
  );
}
