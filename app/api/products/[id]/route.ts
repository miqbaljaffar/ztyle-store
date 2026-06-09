import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sanitizeInput } from '@/lib/sanitizer';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

const updateProductSchema = z.object({
  name: z.string().min(3, { message: "Nama produk harus memiliki setidaknya 3 karakter" }).optional(),
  price: z.number().positive({ message: "Harga harus bernilai positif" }).optional(),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }).optional(),
  categoryId: z.number().int().positive({ message: "Kategori ID tidak valid" }).optional(),
  imageUrl: z.string().min(1, { message: "URL gambar diperlukan" }).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(), 
  specifications: z.record(z.any()).optional(), 
});

// Definisikan tipe untuk params
interface RouteParams {
  id: string;
}

// Mengambil satu produk berdasarkan ID 
export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const { id: productId } = await params;
    const id = parseInt(productId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ ...product, price: Number(product.price) });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Mengupdate produk berdasarkan ID (khusus admin)
export async function PUT(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: newsId } = await params;
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }

    const data = await request.json();
    const validatedData = updateProductSchema.parse(data);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        stock: validatedData.stock,
        imageUrl: validatedData.imageUrl,
        description: validatedData.description ? sanitizeInput(validatedData.description) : undefined,
        categoryId: validatedData.categoryId,
        features: validatedData.features, 
        specifications: validatedData.specifications, 
      },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);

    return NextResponse.json({ ...updatedProduct, price: Number(updatedProduct.price) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Input tidak valid", errors: error.errors }, { status: 400 });
    }
    console.error("Failed to update product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Menghapus produk berdasarkan ID (khusus admin)
export async function DELETE(request: Request, { params }: { params: Promise<RouteParams> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: productId } = await params;
    const id = parseInt(productId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ message: 'Invalid product ID' }, { status: 400 });
    }
    
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
