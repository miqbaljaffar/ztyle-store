import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Endpoint ini khusus untuk menghitung pesanan yang menunggu konfirmasi
export async function GET() {
  const session = await getServerSession(authOptions);
  // Pastikan hanya admin yang bisa mengakses
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Gunakan prisma.order.count() untuk efisiensi
    const pendingCount = await prisma.order.count({
      where: {
        status: 'WAITING_CONFIRMATION',
      },
    });

    return NextResponse.json({ count: pendingCount });
  } catch (error) {
    console.error("Gagal mengambil jumlah pesanan menunggu konfirmasi:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}