import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

interface RouteParams {
  orderId: string;
}

/**
 * GET /api/payment/snap-token/[orderId]
 * Mengambil snapToken yang tersimpan di DB untuk order tertentu.
 * Digunakan ketika user me-refresh halaman payment dan perlu membuka Snap popup lagi.
 */
export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderId } = await params;
    const id = parseInt(orderId);

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        snapToken: true,
        totalAmount: true,
      },
    });

    // Pastikan order ada dan milik user yang sedang login
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ message: 'Order tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({
      snapToken: order.snapToken,
      status: order.status,
      totalAmount: order.totalAmount,
    });

  } catch (error) {
    console.error('[snap-token] Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
