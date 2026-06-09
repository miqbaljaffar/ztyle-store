import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitizer';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateNewsSchema = z.object({
  title: z.string().min(5, { message: "Judul berita harus memiliki setidaknya 5 karakter" }).optional(),
  excerpt: z.string().min(10, { message: "Kutipan berita harus memiliki setidaknya 10 karakter" }).optional(),
  content: z.string().min(20, { message: "Konten berita harus memiliki setidaknya 20 karakter" }).optional(),
  imageUrl: z.string().min(1, { message: "URL gambar berita diperlukan" }).optional(),
  author: z.string().min(3, { message: "Nama penulis harus memiliki setidaknya 3 karakter" }).optional(),
  slug: z.string().optional(),
});

// Definisikan tipe untuk params agar lebih aman
interface RouteParams {
  id: string;
}

/**
 * Mengupdate berita berdasarkan ID.
 * Setelah berhasil, cache untuk halaman daftar dan detail berita akan dihapus.
 */
export async function PUT(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: newsId } = await params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid news ID' }, { status: 400 });
    }

    const data = await request.json();
    const validatedData = updateNewsSchema.parse(data);

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content ? sanitizeInput(validatedData.content) : undefined,
        imageUrl: validatedData.imageUrl,
        author: validatedData.author,
        slug: validatedData.slug,
      },
    });

    // Revalidasi (bersihkan cache) untuk path yang relevan
    revalidatePath('/news'); // Membersihkan cache halaman daftar berita
    if (validatedData.slug) {
      revalidatePath(`/news/${validatedData.slug}`); // Membersihkan cache halaman detail yang diupdate
    }

    return NextResponse.json(updatedNews);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Gagal mengupdate berita:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Menghapus berita berdasarkan ID.
 * Setelah berhasil, cache untuk halaman daftar dan detail berita yang dihapus akan dibersihkan.
 */
export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: newsId } = await params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid news ID' }, { status: 400 });
    }

    // Ambil data berita (terutama slug) SEBELUM dihapus
    const newsToDelete = await prisma.news.findUnique({
      where: { id },
    });

    if (newsToDelete) {
      // Hapus berita dari database
      await prisma.news.delete({
        where: { id },
      });

      // Revalidasi (bersihkan cache) untuk path yang relevan
      revalidatePath('/news'); // Membersihkan cache halaman daftar berita
      revalidatePath(`/news/${newsToDelete.slug}`); // Membersihkan cache halaman detail yang dihapus
    }

    return NextResponse.json({ message: 'Berita berhasil dihapus' }, { status: 200 });
  } catch (error) {
    console.error("Gagal menghapus berita:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
