import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitizer';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const newsSchema = z.object({
  title: z.string().min(5, { message: "Judul berita harus memiliki setidaknya 5 karakter" }),
  excerpt: z.string().min(10, { message: "Kutipan berita harus memiliki setidaknya 10 karakter" }),
  content: z.string().min(20, { message: "Konten berita harus memiliki setidaknya 20 karakter" }),
  imageUrl: z.string().min(1, { message: "URL gambar berita diperlukan" }),
  author: z.string().min(3, { message: "Nama penulis harus memiliki setidaknya 3 karakter" }),
});

/**
 * Mengambil semua berita dengan paginasi.
 * Fungsi ini tidak mengubah data, jadi tidak perlu revalidatePath di sini.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10; // Jumlah item per halaman
    const skip = (page - 1) * limit;

    const [news, totalNews] = await Promise.all([
        prisma.news.findMany({
            orderBy: { createdAt: 'desc' },
            skip: skip,
            take: limit,
        }),
        prisma.news.count(),
    ]);
    
    return NextResponse.json({
        news,
        totalPages: Math.ceil(totalNews / limit),
        currentPage: page,
    });
  } catch (error) {
    console.error("Gagal mengambil berita:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * Membuat berita baru.
 * Setelah berhasil, cache untuk halaman daftar berita dan detail berita baru akan dihapus.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const validatedData = newsSchema.parse(data);

    // Membuat slug dari judul untuk URL yang rapi
    const slug = validatedData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newNews = await prisma.news.create({
      data: {
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content ? sanitizeInput(validatedData.content) : '',
        imageUrl: validatedData.imageUrl,
        author: validatedData.author,
        slug: slug, // Menggunakan slug yang sudah dibuat
      },
    });

    // Revalidasi (bersihkan cache) untuk path yang relevan
    revalidatePath('/news'); // Membersihkan cache halaman daftar berita
    revalidatePath(`/news/${slug}`); // Membersihkan cache untuk halaman detail berita yang baru dibuat

    return NextResponse.json(newNews, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Gagal membuat berita:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
