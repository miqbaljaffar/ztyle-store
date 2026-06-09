'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Tipe data untuk pesanan
interface OrderItem {
  id: number;
  reviewId: number | null;
  product: {
    id: number;
    name: string;
    imageUrl: string;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  createdAt: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (status === 'authenticated') {
      fetch('/api/profile/orders')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [status, router]);
  
  const getStatusBadgeColor = (status: string) => {
    switch(status) {
        case 'PAID':
        case 'SHIPPED':
        case 'DELIVERED':
            return '#22c55e'; // Hijau
        case 'WAITING_CONFIRMATION':
            return '#f97316'; // Oranye
        case 'CANCELLED':
            return '#ef4444'; // Merah
        case 'PENDING':
        default:
            return '#f59e0b'; // Kuning
    }
  };

  if (isLoading) {
    return <div className="card text-center">Memuat riwayat pesanan Anda...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
        <p className="text-gray-600">Lihat semua transaksi yang pernah Anda lakukan.</p>
      </div>

      {orders.length === 0 ? (
        <div className="card text-center">
          <p>Anda belum memiliki riwayat pesanan.</p>
          <Link href="/products" className="btn mt-4">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-bold">Pesanan #{order.id}</h2>
                  <p className="text-sm text-gray-500">
                    Tanggal: {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <span style={{ 
                    padding: '4px 12px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    color: '#fff',
                    backgroundColor: getStatusBadgeColor(order.status)
                }}>
                    {order.status}
                </span>
              </div>
              
              <div className="border-t pt-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-4">
                      <Image src={item.product.imageUrl} alt={item.product.name} width={50} height={50} className="rounded-md object-cover" />
                      <div>
                        <span>{item.product.name} (x{item.quantity})</span>
                        <div className="text-sm mt-2">
                          {/* Logika Tombol Ulasan */}
                          {(order.status === 'DELIVERED' || order.status === 'PAID') && item.reviewId === null && (
                            <Link href={`/products/${item.product.id}?order_item_id=${item.id}#reviews`} className="text-blue-600 hover:underline">
                              Beri Ulasan
                            </Link>
                          )}
                           {item.reviewId !== null && (
                            <span className="text-gray-500">Ulasan telah diberikan</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span>Rp{(item.price * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t mt-4 pt-4 flex justify-between items-center font-bold">
                <span>Total Pesanan:</span>
                <span>Rp{order.totalAmount.toLocaleString('id-ID')}</span>
              </div>
              
              {order.status === 'PENDING' && (
                <div className="mt-4 text-right">
                  <Link href={`/payment/${order.id}`} className="btn">
                    Lanjutkan Pembayaran
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}