import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Fungsi untuk mengelompokkan data penjualan per bulan
const getMonthlySalesData = (orders: any[]) => {
  const salesByMonth: { [key: string]: number } = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  orders.forEach(order => {
    const month = new Date(order.createdAt).getMonth(); 
    const monthName = monthNames[month];
    const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    if (salesByMonth[monthName]) {
      salesByMonth[monthName] += totalItems;
    } else {
      salesByMonth[monthName] = totalItems;
    }
  });
  
  return monthNames.map(month => ({
    name: month,
    sales: salesByMonth[month] || 0,
  }));
};

// Fungsi BARU untuk mengelompokkan pelanggan baru per bulan
const getNewCustomersData = (users: any[]) => {
  const customersByMonth: { [key: string]: number } = {};
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

  // Hanya proses user yang dibuat pada tahun ini
  const currentYear = new Date().getFullYear();
  const usersThisYear = users.filter(user => new Date(user.createdAt).getFullYear() === currentYear);

  usersThisYear.forEach(user => {
    const month = new Date(user.createdAt).getMonth();
    const monthName = monthNames[month];
    if (customersByMonth[monthName]) {
      customersByMonth[monthName]++;
    } else {
      customersByMonth[monthName] = 1;
    }
  });

  return monthNames.map(month => ({
    name: month,
    customers: customersByMonth[month] || 0,
  }));
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    // Ambil data agregasi dasar, hitung di tingkat database
    const [
      totalRevenueAggr,
      totalSalesAggr,
      totalCustomersCount,
      totalProductsCount,
      topSalesGrouped,
      newCustomersThisYear,
      paidOrdersThisYear
    ] = await Promise.all([
      // 1. Total Pendapatan (Sum totalAmount)
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      }),
      // 2. Total Item Terjual (Sum quantity)
      prisma.orderItem.aggregate({
        where: { order: { status: 'PAID' } },
        _sum: { quantity: true }
      }),
      // 3. Jumlah Pelanggan
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      // 4. Jumlah Produk
      prisma.product.count(),
      // 5. Query 5 Produk Terlaris secara langsung di DB
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: { status: 'PAID' }
        },
        _sum: {
          quantity: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 5
      }),
      // 6. Data Pelanggan Baru tahun ini (Hanya kolom createdAt)
      prisma.user.findMany({
        where: {
          role: 'CUSTOMER',
          createdAt: { gte: startOfYear }
        },
        select: { createdAt: true }
      }),
      // 7. Data Pesanan tahun ini untuk chart penjualan (Hanya kolom esensial)
      prisma.order.findMany({
        where: {
          status: 'PAID',
          createdAt: { gte: startOfYear }
        },
        select: {
          createdAt: true,
          items: {
            select: { quantity: true }
          }
        }
      })
    ]);

    const totalRevenue = totalRevenueAggr._sum.totalAmount || 0;
    const totalSales = totalSalesAggr._sum.quantity || 0;

    // Ambil detail nama untuk 5 produk terlaris
    const topProductIds = topSalesGrouped.map(item => item.productId);
    const topProductsInfo = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true }
    });

    const bestSellingProducts = topSalesGrouped.map(sale => {
      const prodInfo = topProductsInfo.find(p => p.id === sale.productId);
      return {
        name: prodInfo?.name || `Produk #${sale.productId}`,
        sales: sale._sum.quantity || 0
      };
    });

    // Siapkan data untuk grafik penjualan bulanan (hanya tahun ini)
    const salesChartData = getMonthlySalesData(paidOrdersThisYear);

    // Siapkan data untuk grafik pelanggan baru
    const newCustomersChartData = getNewCustomersData(newCustomersThisYear);

    return NextResponse.json({
      totalRevenue,
      totalSales,
      totalCustomers: totalCustomersCount,
      totalProducts: totalProductsCount,
      salesChartData,
      bestSellingProducts,
      newCustomersChartData,
    });

  } catch (error) {
    console.error("Gagal mengambil data statistik dashboard:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}