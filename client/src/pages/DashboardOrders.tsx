import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { EyeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Pagination from '../ui/pagination';
import { useNotificationStore } from '../store/notification';

interface Order {
  id: number;
  user: { name: string };
  createdAt: string;
  totalAmount: number;
  status: string;
  paymentProof: string | null;
}

const ProofModal = ({ imageUrl, onClose }: { imageUrl: string; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4 animate-fade-in-fast">
    <div className="relative bg-white p-4 rounded-2xl max-w-lg w-full">
      <button
        onClick={onClose}
        className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-md transition-all"
      >
        &times;
      </button>
      <div className="relative w-full h-[70vh] max-h-[500px] flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
        <img src={imageUrl} alt="Bukti Pembayaran" className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  </div>
);

const getStatusBadge = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PAID':
    case 'SHIPPED':
    case 'DELIVERED':
      return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 uppercase tracking-wider">Paid / Shipped</span>;
    case 'WAITING_CONFIRMATION':
      return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 uppercase tracking-wider">Menunggu Konfirmasi</span>;
    case 'CANCELLED':
      return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 uppercase tracking-wider">Dibatalkan</span>;
    case 'PENDING':
    default:
      return <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-yellow-50 text-yellow-700 uppercase tracking-wider">Pending</span>;
  }
};

function OrdersComponent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const decrementCount = useNotificationStore((state) => state.decrementCount);

  const fetchOrders = async (page: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/all?page=${page}`);
      if (!res.ok) throw new Error('Gagal mengambil data pesanan.');
      const data = await res.json();
      if (data && Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      } else {
        setOrders([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data pesanan.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const handleUpdateStatus = async (orderId: number, newStatus: 'PAID' | 'CANCELLED') => {
    const isConfirming = newStatus === 'PAID';
    const isConfirmed = window.confirm(`Apakah Anda yakin ingin ${isConfirming ? 'mengonfirmasi' : 'membatalkan'} pesanan ini?`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error('Gagal memperbarui status pesanan.');
      }
      toast.success('Status pesanan berhasil diperbarui!');
      decrementCount();
      fetchOrders(currentPage);
    } catch (error) {
      toast.error('Gagal memperbarui status pesanan.');
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Manajemen Pesanan</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Lacak dan kelola semua pesanan yang masuk dari pelanggan.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Order ID</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Pelanggan</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Tanggal</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Total</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs">Status</th>
                <th scope="col" className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider text-xs text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-blue-600">#ZTYLE-{order.id}</td>
                  <td className="px-6 py-4 font-semibold text-gray-800">{order.user?.name || 'Customer'}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center items-center gap-1.5">
                      {order.paymentProof && (
                        <button
                          onClick={() => setViewingProof(order.paymentProof)}
                          className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          title="Lihat Bukti Bayar"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      )}
                      {order.status === 'WAITING_CONFIRMATION' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PAID')}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Konfirmasi Pembayaran"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors"
                            title="Batalkan Pesanan"
                          >
                            <XCircleIcon className="w-4 h-4" />
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
            <p className="text-center text-gray-500 py-10 text-sm">Belum ada pesanan yang masuk.</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      </div>

      {viewingProof && <ProofModal imageUrl={viewingProof} onClose={() => setViewingProof(null)} />}
    </div>
  );
}

export default function DashboardOrders() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <OrdersComponent />
    </Suspense>
  );
}
