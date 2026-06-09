import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Fungsi getOrCreateCart tetap sama
async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }
  return cart;
}

// GET handler tetap sama
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || !cart.items) {
      return NextResponse.json([]); 
    }
    
    return NextResponse.json(cart.items);
  } catch (error) {
    console.error("Gagal mengambil item keranjang:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, quantity } = await request.json();
    if (!productId || !quantity) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ message: 'Produk tidak ditemukan.' }, { status: 404 });
    }

    if (product.stock < quantity) {
      return NextResponse.json({ message: `Stok tidak mencukupi. Sisa stok: ${product.stock}` }, { status: 400 });
    }

    const cart = await getOrCreateCart(session.user.id);

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId: productId,
        quantity: quantity,
      },
    });

    return NextResponse.json(cartItem, { status: 200 });

  } catch (error) {
    console.error("Gagal melakukan upsert ke keranjang:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, quantity } = await request.json();
    if (!productId || quantity === undefined) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: session.user.id } });
    if (!cart) {
      return NextResponse.json({ message: 'Keranjang tidak ditemukan' }, { status: 404 });
    }

    // Jika kuantitas 0, hapus item dari keranjang
    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId: productId } },
      });
      return NextResponse.json({ message: 'Item dihapus' }, { status: 200 });
    }

    // Jika kuantitas lebih dari 0, update kuantitasnya
    const updatedItem = await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: productId,
        },
      },
      data: {
        quantity: quantity,
      },
      include: {
        product: true,
      }
    });

    return NextResponse.json(updatedItem, { status: 200 });

  } catch (error) {
    console.error("Gagal mengupdate item keranjang:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}