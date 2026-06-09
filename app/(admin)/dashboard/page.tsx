'use client'

import { poppins } from '@/app/ui/fonts';
import { useEffect, useState } from 'react';
import { DashboardSkeleton } from '@/app/ui/skeletons'; 
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { BanknotesIcon, ShoppingCartIcon, UserGroupIcon, CubeIcon, ArrowUpIcon } from '@heroicons/react/24/outline';

// Tipe data untuk statistik
interface Stats {
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  totalProducts: number;
  salesChartData: { name: string; sales: number }[];
  bestSellingProducts: { name: string; sales: number }[];
  newCustomersChartData: { name: string; customers: number }[];
  recentSales?: { id: number; user: { name: string }, totalAmount: number, createdAt: string }[]; // Opsional
}

// Komponen Card Statistik yang Baru dan Lebih Menarik
function StatCard({ icon: Icon, title, value, desc }: { icon: React.ElementType, title: string, value: string | number, desc: string }) {
    return (
        // Gunakan flex-col untuk menyusun konten secara vertikal dan justify-between untuk meratakannya
        <div className="bg-white rounded-2xl shadow-lg p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Bagian Atas: Judul dan Ikon */}
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                <div className="bg-blue-100 p-2.5 rounded-lg">
                    <Icon className="h-6 w-6 text-blue-600" />
                </div>
            </div>

            {/* Bagian Bawah: Nilai dan Deskripsi */}
            <div className="mt-2">
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </div>
        </div>
    );
}

// Komponen Card untuk Chart
function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
            <div className="h-80 w-full">
                {children}
            </div>
        </div>
    )
}

// Komponen Chart yang generik (reusable)
function AnalyticsChart({ data, type, dataKey, name, color }: { data: any[], type: 'line' | 'bar', dataKey: string, name:string, color: string }) {
    const ChartComponent = type === 'line' ? LineChart : BarChart;
    const ChartElement = type === 'line' ? Line : Bar;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip
                    contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                        backdropFilter: 'blur(5px)',
                        border: '1px solid #e0e0e0', 
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                />
                <Legend iconSize={10} />
                <ChartElement dataKey={dataKey} name={name} fill={color} stroke={color} type="monotone" />
            </ChartComponent>
        </ResponsiveContainer>
    );
}

// Komponen Utama Halaman Dashboard
export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Gagal mengambil data statistik.');
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
        toast.error("Gagal memuat data statistik.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error || !stats) {
    return (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-8 text-center">
            <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
            <p className="mt-2">Tidak dapat memuat data statistik. Pastikan Anda login sebagai Admin.</p>
        </div>
    );
  }

  return (
    <main className="space-y-8">
      <div>
        <h1 className={`${poppins.className} text-3xl font-bold text-gray-800`}>
            Dashboard Overview
        </h1>
        <p className="text-gray-500 mt-1">Selamat datang kembali! Berikut ringkasan aktivitas toko Anda.</p>
      </div>

      {/* Grid untuk Kartu Statistik */}
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
      
      {/* Layout untuk Chart */}
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