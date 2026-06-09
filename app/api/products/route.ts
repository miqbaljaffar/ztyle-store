import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sanitizeInput } from '@/lib/sanitizer';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const productSchema = z.object({
  name: z.string().min(3, { message: "Nama produk harus memiliki setidaknya 3 karakter" }),
  price: z.number().positive({ message: "Harga harus bernilai positif" }),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }),
  categoryId: z.number().int().positive({ message: "Kategori ID tidak valid" }),
  imageUrl: z.string().min(1, { message: "URL gambar diperlukan" }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(), 
  specifications: z.record(z.any()).optional(), 
});

// Fungsi GET untuk mengambil produk dengan validasi input parameter aman
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validasi page dan limit agar tidak NaN atau negatif
    const pageVal = parseInt(searchParams.get('page') || '1', 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;
    
    const limitVal = parseInt(searchParams.get('limit') || '9', 10);
    const limit = isNaN(limitVal) || limitVal < 1 ? 9 : limitVal;
    
    const skip = (page - 1) * limit;

    const query = searchParams.get('query') || undefined;
    const categoryIds = searchParams.getAll('categoryId').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    
    // Validasi minPrice dan maxPrice
    let minPrice: number | undefined = undefined;
    if (searchParams.has('minPrice')) {
      const parsed = parseFloat(searchParams.get('minPrice')!);
      if (!isNaN(parsed) && parsed >= 0) {
        minPrice = parsed;
      }
    }

    let maxPrice: number | undefined = undefined;
    if (searchParams.has('maxPrice')) {
      const parsed = parseFloat(searchParams.get('maxPrice')!);
      if (!isNaN(parsed) && parsed >= 0) {
        maxPrice = parsed;
      }
    }

    const sort = searchParams.get('sort') || 'newest';

    const where: any = {};
    if (query) { where.name = { contains: query, mode: 'insensitive' }; }
    if (categoryIds.length > 0) { where.categoryId = { in: categoryIds }; }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) { where.price.gte = minPrice; }
      if (maxPrice !== undefined && maxPrice > 0) { where.price.lte = maxPrice; }
    }
    
    const orderBy: any = {};
    if (sort === 'price-asc') { orderBy.price = 'asc'; } 
    else if (sort === 'price-desc') { orderBy.price = 'desc'; } 
    else if (sort === 'popularity') { orderBy.reviews = { _count: 'desc' }; } 
    else { orderBy.createdAt = 'desc'; }

    const totalProducts = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { reviews: true } } },
      orderBy, 
      skip: skip,
      take: limit,
    });

    const productsWithNumberPrice = products.map(p => ({
      ...p,
      price: Number(p.price)
    }));
    
    return NextResponse.json({
      products: productsWithNumberPrice,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Fungsi POST untuk membuat produk baru (diperketat dengan otentikasi admin)
export async function POST(request: Request) {
  try {
    // Validasi sesi admin
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    // Validasi Zod langsung pada input
    const validatedData = productSchema.parse(data);

    const newProduct = await prisma.product.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        stock: validatedData.stock,
        imageUrl: validatedData.imageUrl,
        // Hanya bersihkan konten deskripsi HTML yang membutuhkan sanitasi
        description: validatedData.description ? sanitizeInput(validatedData.description) : undefined,
        categoryId: validatedData.categoryId,
        features: validatedData.features || [], 
        specifications: validatedData.specifications || {},
      },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${newProduct.id}`);

    return NextResponse.json({ ...newProduct, price: Number(newProduct.price) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Input tidak valid", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
