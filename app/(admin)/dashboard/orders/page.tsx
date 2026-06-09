'use client'

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/app/store/notification';
import { useSearchParams } from 'next/navigation'; // 1. Impor useSearchParams
import Pagination from '@/app/ui/pagination'; // 2. Impor komponen Pagination

// Tipe data untuk Order
interface Order {
  id: number;
  user: { name: string; };
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentProof: string | null;
}

// Komponen Modal untuk menampilkan bukti bayar
const ProofModal = ({ imageUrl, onClose }: { imageUrl: string, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
        <div className="relative bg-white p-4 rounded-lg max-w-lg w-full">
            <button onClick={onClose} className="absolute -top-4 -right-4 bg-white rounded-full p-1 z-10 text-2xl font-bold">&times;</button>
            <div className="relative w-full h-[80vh] max-h-[600px]">
                 <Image src={imageUrl} alt="Bukti Pembayaran" fill style={{ objectFit: 'contain' }}/>
            </div>
        </div>
    </div>
);

// Komponen Badge Status
const getStatusBadge = (status: string) => {
    switch(status.toUpperCase()) {
        case 'PAID':
        case 'SHIPPED':
        case 'DELIVERED':
            return <span className="badge bg-green-100 text-green-800">Paid / Shipped</span>;
        case 'WAITING_CONFIRMATION':
            return <span className="badge bg-orange-100 text-orange-800">Menunggu Konfirmasi</span>;
        case 'CANCELLED':
            return <span className="badge bg-red-100 text-red-800">Dibatalkan</span>;
        case 'PENDING':
        default:
            return <span className="badge bg-yellow-100 text-yellow-800">Pending</span>;
    }
};

// Komponen utama dipisahkan untuk menggunakan Suspense
function OrdersComponent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0); // 3. State untuk total halaman

  const searchParams = useSearchParams(); // 4. Dapatkan parameter dari URL
  const currentPage = Number(searchParams.get('page')) || 1; // Ambil halaman saat ini

  const decrementCount = useNotificationStore((state) => state.decrementCount);

  // 5. Ubah fetchOrders untuk menerima nomor halaman
  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders?page=${page}`); // Tambahkan parameter halaman
      if (!res.ok) throw new Error("Gagal mengambil data pesanan.");
      const data = await res.json();
      if(data && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalPages(data.totalPages); // Simpan total halaman dari API
      } else {
        setOrders([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data pesanan.");
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Gunakan useEffect untuk memuat data saat currentPage berubah
  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const handleUpdateStatus = async (orderId: number, newStatus: 'PAID' | 'CANCELLED') => {
    const isConfirming = newStatus === 'PAID';
    toast(`Apakah Anda yakin ingin ${isConfirming ? 'mengonfirmasi' : 'membatalkan'} pesanan ini?`, {
        action: {
            label: isConfirming ? 'Konfirmasi' : 'Batalkan',
            onClick: async () => {
                try {
                    await fetch(`/api/orders/${orderId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus }),
                    });
                    toast.success('Status pesanan berhasil diperbarui!');
                    decrementCount();
                    fetchOrders(currentPage);
                } catch (error) {
                    toast.error('Gagal memperbarui status pesanan.');
                }
            }
        },
        cancel: { 
            label: 'Tutup',
            onClick: () => {}
        }
    });
  };

  if (isLoading) return <p>Memuat data pesanan...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Manajemen Pesanan</h1>
        <p className="text-gray-500 mt-1">Lacak dan kelola semua pesanan yang masuk dari pelanggan.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="tracking-wider border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Order ID</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Pelanggan</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Tanggal</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Total</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-gray-600 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-blue-600">#{order.id}</td>
                  <td className="px-6 py-4 text-gray-800">{order.user.name}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">Rp{order.totalAmount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                     <div className="flex justify-center items-center gap-2">
                        {order.paymentProof && (
                           <button onClick={() => setViewingProof(order.paymentProof)} className="action-btn bg-gray-100 text-gray-700 hover:bg-gray-200" title="Lihat Bukti Bayar">
                               <EyeIcon className="w-5 h-5"/>
                           </button>
                        )}
                        {order.status === 'WAITING_CONFIRMATION' && (
                           <>
                               <button onClick={() => handleUpdateStatus(order.id, 'PAID')} className="action-btn bg-green-100 text-green-700 hover:bg-green-200" title="Konfirmasi Pembayaran">
                                   <CheckCircleIcon className="w-5 h-5"/>
                               </button>
                                <button onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} className="action-btn bg-red-100 text-red-700 hover:bg-red-200" title="Batalkan Pesanan">
                                   <XCircleIcon className="w-5 h-5"/>
                               </button>
                           </>
                        )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && !isLoading && (
            <div className="text-center p-8 text-gray-500">
                <p>Belum ada pesanan yang masuk.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 7. Render komponen Pagination */}
      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>

      {viewingProof && <ProofModal imageUrl={viewingProof} onClose={() => setViewingProof(null)} />}
      <style jsx>{`
        /* ... CSS Anda yang sudah ada ... */
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
        .action-btn { display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 9999px; transition: background-color 0.2s; }
        @keyframes fade-in-fast { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in-fast { animation: fade-in-fast 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}


// Komponen wrapper untuk Suspense
export default function OrdersPage() {
    return (
        <Suspense fallback={<div>Memuat pesanan...</div>}>
            <OrdersComponent />
        </Suspense>
    )
}