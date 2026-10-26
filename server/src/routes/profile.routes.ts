import { Router, Response } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { profileSchema } from '../schemas';

const router = Router();

// ─── GET /api/profile ─────────────────────────────────────────
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phoneNumber: true, address: true, role: true },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error("[profile/get]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PUT /api/profile ─────────────────────────────────────────
router.put('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const data = profileSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: data.name, phoneNumber: data.phoneNumber, address: data.address },
    });

    // Jangan kembalikan field password
    const { password: _pw, ...result } = updated;
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[profile/update]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/profile/orders ──────────────────────────────────
router.get('/orders', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: { select: { name: true, imageUrl: true, id: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error("[profile/orders]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
