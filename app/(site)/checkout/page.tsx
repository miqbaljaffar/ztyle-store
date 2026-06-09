'use client'

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useCartStore } from '@/app/store/cart';
import { toast } from 'sonner';
import { MapPinIcon, ShoppingCartIcon, TrashIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function CheckoutPage() {
  const { items: cartItems, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [shippingAddress, setShippingAddress] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [addressOption, setAddressOption] = useState('saved');
  const [snapReady, setSnapReady] = useState(false);

  useEffect(() => {
    if (session?.user?.address) {
      setShippingAddress(session.user.address);
    }
  }, [session]);

  // Alamat yang benar-benar dipakai untuk order
  const activeAddress = useMemo(() => {
    if (addressOption === 'saved') return session?.user?.address || '';
    return shippingAddress;
  }, [addressOption, shippingAddress, session]);

  const totalPrice = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const handlePlaceOrder = useCallback(async () => {
    if (status === 'unauthenticated') {
      toast.error('Anda harus login untuk melanjutkan pesanan.');
      router.push('/login');
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
        onSuccess: (result) => {
          toast.success('Pembayaran berhasil! Terima kasih.');
          router.push(`/payment/success?order_id=${orderData.id}`);
        },
        onPending: (result) => {
          toast.info('Pembayaran sedang diproses. Kami akan konfirmasi segera.');
          router.push(`/payment/${orderData.id}`);
        },
        onError: (result) => {
          toast.error('Pembayaran gagal. Silakan coba lagi.');
          router.push(`/payment/${orderData.id}`);
        },
        onClose: () => {
          // User menutup popup tanpa bayar — arahkan ke halaman payment untuk bayar nanti
          toast.info('Pembayaran belum selesai. Anda bisa menyelesaikan kapan saja.');
          router.push(`/payment/${orderData.id}`);
        },
      });

    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.');
      setIsProcessing(false);
    }
  }, [status, activeAddress, cartItems, snapReady, clearCart, router]);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (cartItems.length === 0 && !isProcessing) {
    return (
      <div className="text-center py-20">
        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-400" />
        <h1 className="mt-4 text-2xl font-bold text-gray-800">Keranjang Anda Kosong</h1>
        <p className="mt-2 text-gray-500">Sepertinya Anda belum menambahkan produk apapun.</p>
        <Link href="/products" className="btn mt-6">
          Mulai Belanja
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Load Midtrans Snap.js */}
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

      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Kolom Kiri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ringkasan Pesanan */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Ringkasan Pesanan</h2>
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="object-cover rounded-lg"/>
                    <div className="flex-grow">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <p className="text-sm text-gray-500">Rp{item.price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="btn-qty">-</button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="btn-qty">+</button>
                    </div>
                    <strong className="w-28 text-right text-gray-800">Rp{(item.price * item.quantity).toLocaleString('id-ID')}</strong>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <TrashIcon className="h-5 w-5"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Alamat Pengiriman */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
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
                  <label htmlFor="saved-address" className="ml-3 block text-sm font-medium text-gray-700">
                    Gunakan Alamat Tersimpan
                  </label>
                </div>
                {addressOption === 'saved' && (
                  <div className="pl-7 text-gray-600 bg-gray-50 rounded-lg p-3">
                    <p>{session?.user?.address || 'Tidak ada alamat tersimpan. Pilih "Gunakan Alamat Baru" di bawah.'}</p>
                  </div>
                )}
                <div className="flex items-center">
                  <input
                    type="radio" id="new-address" name="addressOption" value="new"
                    checked={addressOption === 'new'}
                    onChange={() => setAddressOption('new')}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="new-address" className="ml-3 block text-sm font-medium text-gray-700">
                    Gunakan Alamat Baru
                  </label>
                </div>
                {addressOption === 'new' && (
                  <div className="pl-7">
                    <textarea
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Masukkan alamat lengkap Anda (Jalan, No. Rumah, Kelurahan, Kecamatan, Kota, Kode Pos)"
                      className="input-field w-full"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan & Bayar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              {/* Info Pembayaran */}
              <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-blue-500" />
                Metode Pembayaran
              </h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">Pilih metode pembayaran di langkah berikutnya</p>
                <p className="text-xs text-blue-600 mt-1">GoPay, OVO, Dana, QRIS, VA Bank, Kartu Kredit & lainnya</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {['gopay', 'ovo', 'dana', 'bca', 'bni', 'qris'].map(m => (
                    <span key={m} className="text-xs bg-white border border-blue-200 text-blue-700 rounded px-2 py-0.5 font-semibold uppercase">{m}</span>
                  ))}
                  <span className="text-xs text-blue-500">+lainnya</span>
                </div>
              </div>

              <hr className="my-4"/>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal</span>
                  <strong>Rp{totalPrice.toLocaleString('id-ID')}</strong>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Biaya Pengiriman</span>
                  <strong className="text-green-600">Gratis</strong>
                </div>
                <div className="flex justify-between items-center text-xl font-bold pt-2 text-gray-800">
                  <span>Total</span>
                  <strong>Rp{totalPrice.toLocaleString('id-ID')}</strong>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="btn w-full text-lg py-3 mt-6"
                disabled={isProcessing || !snapReady}
              >
                {isProcessing ? 'Memproses...' : !snapReady ? 'Memuat...' : 'Buat Pesanan & Bayar'}
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-400">
                <ShieldCheckIcon className="h-4 w-4" />
                <span>Pembayaran aman & terenkripsi oleh Midtrans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          padding: 0.75rem;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .input-field:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        .btn-qty {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 2rem;
          height: 2rem;
          border-radius: 9999px;
          background-color: #f3f4f6;
          font-weight: bold;
          color: #374151;
          transition: background-color 0.2s;
        }
        .btn-qty:hover {
          background-color: #e5e7eb;
        }
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </>
  )
}