import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createSnapTransaction } from '@/lib/midtrans';

// Definisikan tipe untuk produk yang diambil dari database
interface ProductFromDb {
    id: number;
    name: string;
    price: number;
    stock: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const { shippingAddress, items } = await request.json();

    if (!shippingAddress) {
      return NextResponse.json({ message: "Alamat pengiriman wajib diisi." }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ message: "Keranjang belanja kosong." }, { status: 400 });
    }

    const productIds = items.map((item: any) => item.productId);
    const productsFromDb = await prisma.product.findMany({
        where: { id: { in: productIds } },
    });
    
    // Buat map untuk akses data produk dari DB dengan mudah dan berikan tipe eksplisit (konversi Decimal ke number)
    const productMap = new Map<number, ProductFromDb>(
        productsFromDb.map((p: any) => [p.id, {
          id: p.id,
          name: p.name,
          price: Number(p.price),
          stock: p.stock,
        }])
    );

    let totalAmount = 0;
    for (const item of items) {
        const product = productMap.get(item.productId);
        if (!product) {
            throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
        }
        totalAmount += product.price * item.quantity;
    }

    // Buat order di database menggunakan Prisma transaction
    const order = await prisma.$transaction(async (tx: any) => {
      // Kurangi stok produk secara atomis
      for (const item of items) {
        const product = productMap.get(item.productId);
        
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new Error(`Stok untuk produk ${product?.name || 'yang Anda pilih'} tidak mencukupi.`);
        }
      }

      // Buat pesanan baru — paymentMethod diset ke 'midtrans' karena Snap menangani semua metode
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          status: 'PENDING',
          shippingAddress,
          paymentMethod: 'midtrans',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: productMap.get(item.productId)!.price,
            })),
          },
        },
        include: { items: { include: { product: true } } }
      });
      
      return newOrder;
    });

    // Generate Midtrans Order ID yang unik: ZTYLE-{orderId}-{timestamp}
    const midtransOrderId = `ZTYLE-${order.id}-${Date.now()}`;

    // Siapkan item details untuk Midtrans
    const itemDetails = order.items.map((item: any) => ({
      id: String(item.productId),
      price: Math.round(Number(item.price)),
      quantity: item.quantity,
      name: item.product.name.substring(0, 50), // Midtrans max 50 karakter
    }));

    // Generate Snap token dari Midtrans
    const snapToken = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount: Math.round(totalAmount),
      itemDetails,
      customerDetails: {
        first_name: session.user.name || 'Pelanggan',
        email: session.user.email || '',
        phone: session.user.phoneNumber || undefined,
      },
    });

    // Simpan snapToken dan midtransOrderId ke order
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { snapToken, midtransOrderId },
    });

    return NextResponse.json({ ...updatedOrder, snapToken }, { status: 201 });

  } catch (error: any) {
    console.error("Gagal membuat pesanan:", error);
    if (
      error.message.startsWith('Stok untuk produk') ||
      error.message.startsWith('Produk dengan ID')
    ) {
       return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}