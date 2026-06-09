import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCartStore } from '../store/cart';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { MapPinIcon, ShoppingCartIcon, TrashIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

// Window snap typing is declared globally in client/src/global.d.ts

export default function Checkout() {
  const { items: cartItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressOption, setAddressOption] = useState('saved');
  const [snapReady, setSnapReady] = useState(false);

  useEffect(() => {
    if (user?.address) {
      setShippingAddress(user.address);
    }
  }, [user]);

  // Load Midtrans Snap.js script dynamically
  useEffect(() => {
    // Sandbox vs Production based on import.meta.env
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
      toast.error('Gagal memuat metode pembayaran.');
    };
    document.body.appendChild(script);

    return () => {
      // Keep script in body, no need to remove to prevent reloading issues
    };
  }, []);

  // Alamat yang benar-benar dipakai untuk order
  const activeAddress = useMemo(() => {
    if (addressOption === 'saved') return user?.address || '';
    return shippingAddress;
  }, [addressOption, shippingAddress, user]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const handlePlaceOrder = useCallback(async () => {
    if (!user) {
      toast.error('Anda harus login untuk melanjutkan pesanan.');
      navigate('/login');
      return;
    }

    if (!activeAddress.trim()) {
      toast.error('Alamat pengiriman wajib diisi.');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Keranjang Anda kosong.');
      return;
    }

    if (!snapReady) {
      toast.error('Sistem pembayaran belum siap, coba lagi sebentar.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Buat order di server & dapatkan snapToken dari Midtrans
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingAddress: activeAddress,
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
          })),
        }),
      });

      const orderData = await res.json();

      if (!res.ok) {
        throw new Error(orderData.message || 'Gagal membuat pesanan.');
      }

      // 2. Kosongkan cart setelah order berhasil dibuat
      clearCart();

      // 3. Buka Midtrans Snap popup
      window.snap.pay(orderData.snapToken, {
        onSuccess: () => {
          toast.success('Pembayaran berhasil! Terima kasih.');
          navigate(`/payment/success?order_id=${orderData.id}`);
        },
        onPending: () => {
          toast.info('Pembayaran sedang diproses. Kami akan konfirmasi segera.');
          navigate(`/payment/${orderData.id}`);
        },
        onError: () => {
          toast.error('Pembayaran gagal. Silakan coba lagi.');
          navigate(`/payment/${orderData.id}`);
        },
        onClose: () => {
          // User menutup popup tanpa bayar — arahkan ke halaman payment untuk bayar nanti
          toast.info('Pembayaran belum selesai. Anda bisa menyelesaikan kapan saja.');
          navigate(`/payment/${orderData.id}`);
        },
      });

    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
      setIsProcessing(false);
    }
  }, [user, activeAddress, cartItems, snapReady, clearCart, navigate]);

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20 px-4 max-w-md mx-auto">
        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Perlu Login</h1>
        <p className="mt-2 text-gray-500">Anda harus masuk ke akun Anda terlebih dahulu untuk mengakses halaman checkout.</p>
        <Link to="/login" className="btn btn-primary mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0 && !isProcessing) {
    return (
      <div className="text-center py-20 px-4">
        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Keranjang Anda Kosong</h1>
        <p className="mt-2 text-gray-500">Sepertinya Anda belum menambahkan produk apapun ke keranjang Anda.</p>
        <Link to="/products" className="btn mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-5 text-gray-900">Ringkasan Pesanan</h2>
            <div className="divide-y divide-gray-100">
              {cartItems.map(item => (
                <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50"/>
                  <div className="flex-grow">
                    <h3 className="font-bold text-gray-900 text-sm md:text-base">{item.name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">Rp{item.price.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-2 sm:mt-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0">
                    <strong className="text-right text-gray-900 w-24 text-sm md:text-base">
                      Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                    </strong>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5"/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold mb-5 text-gray-900 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-blue-500" />
              Alamat Pengiriman
            </h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="radio" id="saved-address" name="addressOption" value="saved"
                  checked={addressOption === 'saved'}
                  onChange={() => setAddressOption('saved')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="saved-address" className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  Gunakan Alamat Tersimpan
                </label>
              </div>
              
              {addressOption === 'saved' && (
                <div className="pl-7 text-sm text-gray-600 bg-gray-50 border border-gray-100 rounded-xl p-4 leading-relaxed">
                  <p>{user?.address || 'Tidak ada alamat tersimpan. Pilih "Gunakan Alamat Baru" di bawah.'}</p>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="radio" id="new-address" name="addressOption" value="new"
                  checked={addressOption === 'new'}
                  onChange={() => setAddressOption('new')}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="new-address" className="ml-3 text-sm font-semibold text-gray-700 cursor-pointer">
                  Gunakan Alamat Baru
                </label>
              </div>
              
              {addressOption === 'new' && (
                <div className="pl-7">
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Masukkan alamat lengkap Anda (Jalan, No. Rumah, Kelurahan, Kecamatan, Kota, Kode Pos)"
                    className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm leading-relaxed"
                    rows={4}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Payment Method & Totals */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24 space-y-6">
            
            {/* Payment Info */}
            <div>
              <h2 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-blue-500" />
                Metode Pembayaran
              </h2>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-800 font-bold">Pilih metode pembayaran di langkah berikutnya</p>
                <p className="text-[11px] text-blue-600 mt-1 leading-relaxed">GoPay, OVO, Dana, QRIS, VA Bank, Kartu Kredit & lainnya</p>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {['gopay', 'ovo', 'dana', 'bca', 'bni', 'qris'].map(m => (
                    <span key={m} className="text-[10px] bg-white border border-blue-100 text-blue-700 rounded-md px-1.5 py-0.5 font-bold uppercase tracking-wider">{m}</span>
                  ))}
                  <span className="text-[10px] text-blue-500 font-bold self-center">+lainnya</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100"/>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm text-gray-500 font-medium">
                <span>Subtotal</span>
                <span className="text-gray-900 font-bold">Rp{totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 font-medium">
                <span>Biaya Pengiriman</span>
                <span className="text-green-600 font-extrabold">Gratis</span>
              </div>
              <hr className="border-gray-50 my-2" />
              <div className="flex justify-between items-center text-lg font-black text-gray-900 pt-1">
                <span>Total</span>
                <span>Rp{totalPrice.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className={`w-full py-4 text-center rounded-xl font-bold text-base transition-all ${
                isProcessing || !snapReady
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
              }`}
              disabled={isProcessing || !snapReady}
            >
              {isProcessing ? 'Memproses...' : !snapReady ? 'Memuat Pembayaran...' : 'Buat Pesanan & Bayar'}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-medium">
              <ShieldCheckIcon className="h-4 w-4 text-green-500" />
              <span>Pembayaran aman & terenkripsi oleh Midtrans</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
