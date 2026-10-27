import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { DashboardSkeleton } from '../ui/skeletons';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { BanknotesIcon, ShoppingCartIcon, UserGroupIcon, CubeIcon } from '@heroicons/react/24/outline';

interface Stats {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  salesChartData: { name: string; sales: number }[];
  bestSellingProducts: { name: string; sales: number }[];
  newCustomersChartData: { name: string; customers: number }[];
}

function StatCard({
  icon: Icon,
  title,
  value,
  desc,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="flex justify-between items-start">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</h3>
        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
          <Icon className="h-5 w-5 text-blue-600" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] font-bold text-green-600 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-base font-bold text-gray-900 mb-5">{title}</h2>
      <div className="h-80 w-full">{children}</div>
    </div>
  );
}

function AnalyticsChart({
  data,
  type,
  dataKey,
  name,
  color,
}: {
  data: any[];
  type: 'line' | 'bar';
  dataKey: string;
  name: string;
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === 'line' ? (
        <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#9ca3af" />
          <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '11px',
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Line dataKey={dataKey} name={name} stroke={color} type="monotone" strokeWidth={2} />
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#9ca3af" />
          <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '11px',
            }}
          />
          <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Bar dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      toast.error('Akses ditolak. Halaman ini hanya untuk Admin.');
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Gagal mengambil data statistik.');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan.');
        toast.error('Gagal memuat data statistik.');
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.role === 'ADMIN') {
      fetchStats();
    }
  }, [user]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-8 text-center max-w-lg mx-auto mt-12">
        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
        <p className="mt-2 text-sm">Tidak dapat memuat data statistik. Pastikan Anda login sebagai Admin.</p>
      </div>
    );
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">Selamat datang kembali! Berikut ringkasan aktivitas toko Anda.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BanknotesIcon}
          title="Total Pendapatan"
          value={`Rp${stats.totalRevenue.toLocaleString('id-ID')}`}
          desc="+20.1% dari bulan lalu"
        />
        <StatCard
          icon={ShoppingCartIcon}
          title="Total Penjualan"
          value={stats.totalSales.toLocaleString('id-ID')}
          desc="+180.1% dari bulan lalu"
        />
        <StatCard
          icon={UserGroupIcon}
          title="Jumlah Pelanggan"
          value={stats.totalCustomers.toLocaleString('id-ID')}
          desc="+50 dari bulan lalu"
        />
        <StatCard
          icon={CubeIcon}
          title="Jumlah Produk"
          value={stats.totalProducts.toLocaleString('id-ID')}
          desc="Total produk aktif"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard title="Grafik Penjualan (Unit per Bulan)">
            <AnalyticsChart
              data={stats.salesChartData}
              type="line"
              dataKey="sales"
              name="Unit Terjual"
              color="#10b981"
            />
          </ChartCard>
        </div>
        <div>
          <ChartCard title="5 Produk Terlaris (Unit)">
            <AnalyticsChart
              data={stats.bestSellingProducts}
              type="bar"
              dataKey="sales"
              name="Unit Terjual"
              color="#3b82f6"
            />
          </ChartCard>
        </div>
        <div className="lg:col-span-3">
          <ChartCard title="Grafik Pelanggan Baru (Tahun Ini)">
            <AnalyticsChart
              data={stats.newCustomersChartData}
              type="line"
              dataKey="customers"
              name="Pelanggan Baru"
              color="#8b5cf6"
            />
          </ChartCard>
        </div>
      </div>
    </main>
  );
}
