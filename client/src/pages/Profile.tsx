import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { UserCircleIcon, ShieldCheckIcon, MapPinIcon, PhoneIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

const profileSchema = z.object({
  name: z.string().min(3, 'Nama harus memiliki setidaknya 3 karakter.').max(50),
  phoneNumber: z.string().max(15).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: {
    name: string;
    imageUrl: string;
  };
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  shippingAddress: string;
  createdAt: string;
  snapToken: string | null;
  items: OrderItem[];
}

export default function Profile() {
  const { user, checkSession } = useAuthStore();
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'profile' | 'orders'>(
    tabParam === 'orders' ? 'orders' : 'profile'
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      address: '',
    },
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      reset({
        name: user.name ?? '',
        phoneNumber: user.phoneNumber ?? '',
        address: user.address ?? '',
      });
    }
  }, [user, reset, navigate]);

  // Fetch orders
  useEffect(() => {
    if (activeTab === 'orders' && user) {
      const fetchOrders = async () => {
        try {
          setLoadingOrders(true);
          const res = await fetch('/api/profile/orders');
          if (res.ok) {
            const data = await res.json();
            setOrders(data);
          } else {
            toast.error('Gagal mengambil data pesanan.');
          }
        } catch (error) {
          console.error(error);
          toast.error('Terjadi kesalahan koneksi.');
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, user]);

  const onSubmit = async (data: ProfileFormValues) => {
    setApiError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || 'Gagal memperbarui profil.');
      }

      await checkSession(); // Refresh session in authStore
      toast.success('Profil berhasil diperbarui!');
      reset(data); // reset dirty status
    } catch (err: any) {
      setApiError(err.message || 'Gagal memperbarui profil.');
      toast.error(err.message || 'Terjadi kesalahan.');
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Pengaturan Akun</h1>
        <p className="text-gray-500 mt-1.5 text-sm">Kelola informasi profil dan riwayat pesanan Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Informasi Profil
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Riwayat Pesanan
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {activeTab === 'profile' ? (
          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* User avatar/card */}
            <div className="md:col-span-1 p-8 bg-gray-50/50 border-r border-gray-100 flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-black shadow-inner">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 font-bold text-gray-900 text-lg leading-snug">{user.name}</h2>
              <p className="text-gray-400 text-xs mt-1">{user.email}</p>
              <span className="mt-3 text-[10px] font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider">
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                Verified Account
              </span>
            </div>

            {/* Profile editing form */}
            <div className="md:col-span-2 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {apiError && (
                  <p className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-center text-red-600 text-sm font-semibold">
                    {apiError}
                  </p>
                )}

                <div>
                  <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      {...register('name')}
                      id="name"
                      type="text"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Nomor Telepon
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      {...register('phoneNumber')}
                      id="phoneNumber"
                      type="tel"
                      disabled={isSubmitting}
                      placeholder="Contoh: 08123456789"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {errors.phoneNumber && <p className="mt-1 text-xs text-red-500 font-medium">{errors.phoneNumber.message}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Alamat Lengkap
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute top-3 left-3">
                      <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <textarea
                      {...register('address')}
                      id="address"
                      rows={4}
                      disabled={isSubmitting}
                      placeholder="Jalan, Kelurahan, Kecamatan, Kota, Kode Pos"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm leading-relaxed"
                    />
                  </div>
                  {errors.address && <p className="mt-1 text-xs text-red-500 font-medium">{errors.address.message}</p>}
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => reset()}
                    disabled={!isDirty || isSubmitting}
                    className="py-2.5 px-5 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={!isDirty || isSubmitting}
                    className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Daftar Transaksi Anda</h2>
            {loadingOrders ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-300" />
                <p className="text-gray-500 mt-3 text-sm">Anda belum melakukan transaksi apapun.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-50 pb-3 mb-4 gap-2">
                      <div>
                        <p className="text-xs text-gray-400 font-medium">No. Pesanan: <span className="font-bold text-gray-800">#ZTYLE-{order.id}</span></p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        order.status === 'PAID' || order.status === 'DELIVERED'
                          ? 'bg-green-50 text-green-700'
                          : order.status === 'PENDING'
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img src={item.product?.imageUrl} alt={item.product?.name} className="w-12 h-12 object-cover rounded-xl border border-gray-100 bg-gray-50" />
                          <div className="flex-grow">
                            <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.product?.name}</h4>
                            <p className="text-xs text-gray-400 mt-0.5">{item.quantity} x Rp{item.price.toLocaleString('id-ID')}</p>
                          </div>
                          {order.status === 'DELIVERED' && (
                            <Link
                              to={`/products/${item.productId}?order_item_id=${item.id}`}
                              className="text-xs text-blue-600 font-bold self-center border border-blue-100 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Tulis Ulasan
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-gray-50 mt-4 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-sm font-semibold text-gray-600">
                        Total: <span className="text-base font-black text-gray-900">Rp{order.totalAmount.toLocaleString('id-ID')}</span>
                      </div>
                      
                      {order.status === 'PENDING' && order.snapToken && (
                        <button
                          onClick={() => {
                            if (window.snap) {
                              window.snap.pay(order.snapToken!, {
                                onSuccess: () => {
                                  toast.success('Pembayaran berhasil!');
                                  setActiveTab('orders');
                                },
                                onPending: () => toast.info('Pembayaran tertunda.'),
                                onError: () => toast.error('Pembayaran gagal.'),
                                onClose: () => toast.info('Pembayaran dibatalkan.'),
                              });
                            } else {
                              toast.error('Metode pembayaran belum siap.');
                            }
                          }}
                          className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          Bayar Sekarang
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
