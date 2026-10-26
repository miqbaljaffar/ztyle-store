import { Router, Response } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { reviewSchema } from '../schemas';

const router = Router();

// ─── GET /api/reviews/check ───────────────────────────────────
router.get('/check', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const productId = parseInt(req.query.productId as string, 10);
    const orderItemId = parseInt(req.query.orderItemId as string, 10);

    if (isNaN(productId) || isNaN(orderItemId)) return res.json({ canReview: false });

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        productId,
        order: { userId: req.user.id, status: { in: ['PAID', 'DELIVERED'] } },
        reviewId: null,
      },
    });

    return res.json({ canReview: !!orderItem });
  } catch (error) {
    console.error("[reviews/check]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/reviews ────────────────────────────────────────
router.post('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const data = reviewSchema.parse(req.body);
    const userId = req.user.id;

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: data.orderItemId,
        productId: data.productId,
        order: { userId, status: { in: ['DELIVERED', 'PAID'] } },
        reviewId: null,
      },
    });

    if (!orderItem) {
      return res.status(403).json({ message: "Anda tidak dapat memberikan ulasan untuk produk ini atau ulasan sudah ada." });
    }

    const review = await prisma.$transaction(
      async (tx) => {
        const created = await tx.review.create({
          data: { rating: data.rating, comment: data.comment, userId, productId: data.productId },
        });
        await tx.orderItem.update({ where: { id: orderItem.id }, data: { reviewId: created.id } });
        return created;
      },
      { maxWait: 15000, timeout: 30000 }
    );

    return res.status(201).json(review);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.flatten().fieldErrors });
    }
    if ((error as any).code === 'P2028') {
      return res.status(504).json({ message: "Proses terlalu lama, transaksi timeout. Coba lagi." });
    }
    console.error("[reviews/create]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
