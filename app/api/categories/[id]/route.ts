import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitizer';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Definisikan tipe untuk params
interface RouteParams {
  id: string;
}

// Mengupdate kategori (khusus admin)
export async function PUT(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: categoryId } = await params;
    const id = parseInt(categoryId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid category ID' }, { status: 400 });
    }

    const { name } = await request.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ message: "Nama kategori diperlukan dan harus berupa text" }, { status: 400 });
    }
    const sanitizedName = sanitizeInput(name);
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: { name: sanitizedName },
    });
    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Gagal mengupdate kategori:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Menghapus kategori (khusus admin)
export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: categoryId } = await params;
    const id = parseInt(categoryId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid category ID' }, { status: 400 });
    }

    // Tambahan: Cek apakah ada produk yang menggunakan kategori ini
    const productsInCategory = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productsInCategory > 0) {
      return NextResponse.json(
        { message: "Tidak dapat menghapus kategori karena masih digunakan oleh produk lain." },
        { status: 400 }
      );
    }
    
    await prisma.category.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Kategori berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}