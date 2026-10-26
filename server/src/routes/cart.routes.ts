import { Router, Response } from 'express';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';

const router = Router();

// Helper: cari atau buat cart milik user
async function getOrCreateCart(userId: number) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

// ─── GET /api/cart ────────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    return res.json(cart?.items ?? []);
  } catch (error) {
    console.error("[cart/get]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/cart ───────────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, quantity } = req.body;
    if (!productId || !quantity) return res.status(400).json({ message: 'Data tidak lengkap' });

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Stok tidak mencukupi. Sisa stok: ${product.stock}` });
    }

    const cart = await getOrCreateCart(req.user.id);
    const item = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });

    return res.json(item);
  } catch (error) {
    console.error("[cart/add]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PUT /api/cart ────────────────────────────────────────────
router.put('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, quantity } = req.body;
    if (productId === undefined || quantity === undefined) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ message: 'Keranjang tidak ditemukan' });

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
      return res.json({ message: 'Item dihapus' });
    }

    const updated = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
      include: { product: true },
    });

    return res.json(updated);
  } catch (error) {
    console.error("[cart/update]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
