import { Router, Response } from 'express';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

// ─── GET /api/dashboard/stats (admin) ────────────────────────
router.get('/stats', authenticateJWT, requireRole(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
      revenueAggr,
      salesAggr,
      totalCustomers,
      totalProducts,
      topSalesGrouped,
      newCustomersThisYear,
      paidOrdersThisYear,
    ] = await Promise.all([
      prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.orderItem.aggregate({ where: { order: { status: 'PAID' } }, _sum: { quantity: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: 'PAID' } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.user.findMany({
        where: { role: 'CUSTOMER', createdAt: { gte: startOfYear } },
        select: { createdAt: true },
      }),
      prisma.order.findMany({
        where: { status: 'PAID', createdAt: { gte: startOfYear } },
        select: { createdAt: true, items: { select: { quantity: true } } },
      }),
    ]);

    // Ambil nama produk untuk top sellers
    const topProductIds = topSalesGrouped.map((i) => i.productId);
    const topProductsInfo = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });

    const bestSellingProducts = topSalesGrouped.map((sale) => ({
      name: topProductsInfo.find((p) => p.id === sale.productId)?.name ?? `Produk #${sale.productId}`,
      sales: sale._sum.quantity ?? 0,
    }));

    // Helper: kelompokkan data per bulan
    const groupByMonth = <T extends { createdAt: Date }>(
      items: T[],
      getValue: (item: T) => number,
      key: string
    ) => {
      const byMonth: Record<string, number> = {};
      items.forEach((item) => {
        const month = MONTH_NAMES[new Date(item.createdAt).getMonth()];
        byMonth[month] = (byMonth[month] ?? 0) + getValue(item);
      });
      return MONTH_NAMES.map((month) => ({ name: month, [key]: byMonth[month] ?? 0 }));
    };

    const salesChartData = groupByMonth(
      paidOrdersThisYear,
      (order) => order.items.reduce((sum, item) => sum + item.quantity, 0),
      'sales'
    );

    const newCustomersChartData = groupByMonth(newCustomersThisYear, () => 1, 'customers');

    return res.json({
      totalRevenue: revenueAggr._sum.totalAmount ?? 0,
      totalSales: salesAggr._sum.quantity ?? 0,
      totalCustomers,
      totalProducts,
      salesChartData,
      bestSellingProducts,
      newCustomersChartData,
    });
  } catch (error) {
    console.error("[dashboard/stats]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
