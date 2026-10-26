import { Router, Response } from 'express';

import prisma from '../lib/prisma';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// ─── GET /api/orders/all (admin) ─────────────────────────────
router.get('/all', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        include: { user: { select: { name: true, email: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);

    return res.json({ orders, totalPages: Math.ceil(totalOrders / limit), currentPage: page });
  } catch (error) {
    console.error("[orders/all]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/orders/pending-count (admin) ────────────────────
router.get('/pending-count', authenticateJWT, requireRole(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.order.count({ where: { status: 'WAITING_CONFIRMATION' } });
    return res.json({ count });
  } catch (error) {
    console.error("[orders/pending-count]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/orders/:id ──────────────────────────────────────
router.get('/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const id = parseInt(req.params.id, 10);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!order || (order.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }

    return res.json(order);
  } catch (error) {
    console.error("[orders/detail]", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ─── PUT /api/orders/:id (admin update status) ────────────────
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status diperlukan' });

    const updated = await prisma.order.update({ where: { id }, data: { status } });
    return res.json(updated);
  } catch (error) {
    console.error("[orders/update-status]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
