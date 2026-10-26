import { Router, Response } from 'express';

import prisma from '../lib/prisma';
import { createSnapTransaction } from '../lib/midtrans';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── POST /api/checkout ───────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { shippingAddress, items } = req.body;
    if (!shippingAddress) return res.status(400).json({ message: "Alamat pengiriman wajib diisi." });
    if (!items || items.length === 0) return res.status(400).json({ message: "Keranjang belanja kosong." });

    const userId = req.user.id;
    const productIds: number[] = items.map((i: any) => i.productId);

    const productsFromDb = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(productsFromDb.map((p) => [p.id, { ...p, price: Number(p.price) }]));

    let totalAmount = 0;
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      totalAmount += product.price * item.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          const p = productMap.get(item.productId);
          throw new Error(`Stok untuk produk ${p?.name ?? 'yang Anda pilih'} tidak mencukupi.`);
        }
      }

      return tx.order.create({
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
        include: { items: { include: { product: true } } },
      });
    });

    const midtransOrderId = `ZTYLE-${order.id}-${Date.now()}`;
    const snapToken = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount: Math.round(totalAmount),
      itemDetails: order.items.map((item: any) => ({
        id: String(item.productId),
        price: Math.round(Number(item.price)),
        quantity: item.quantity,
        name: item.product.name.substring(0, 50),
      })),
      customerDetails: {
        first_name: req.user.name || 'Pelanggan',
        email: req.user.email || '',
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { snapToken, midtransOrderId },
    });

    // Kosongkan keranjang setelah checkout berhasil
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return res.status(201).json({ ...updatedOrder, snapToken });
  } catch (error: any) {
    console.error("[checkout]", error);
    if (error.message?.startsWith('Stok') || error.message?.startsWith('Produk dengan ID')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
