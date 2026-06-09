import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET handler untuk mengambil riwayat pesanan pengguna yang login
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, imageUrl: true, id: true } // Tambahkan id produk
            }
          },
          // Sertakan semua field dari OrderItem, termasuk id dan reviewId
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal mengambil riwayat pesanan:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}