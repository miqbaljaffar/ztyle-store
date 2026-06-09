import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET handler untuk mengambil semua pesanan dengan paginasi (khusus admin)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
        prisma.order.findMany({
          include: {
            user: {
              select: { name: true, email: true }
            },
            items: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: skip,
          take: limit,
        }),
        prisma.order.count(),
    ]);
    
    return NextResponse.json({
        orders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: page,
    });
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}