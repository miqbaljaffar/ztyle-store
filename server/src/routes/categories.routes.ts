import { Router, Request, Response } from 'express';

import prisma from '../lib/prisma';
import { sanitizeInput } from '../lib/sanitizer';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';

const router = Router();

// ─── GET /api/categories ──────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({ skip, take: limit, orderBy: { id: 'asc' } }),
      prisma.category.count(),
    ]);

    return res.json({
      categories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("[categories/list]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/categories (admin) ────────────────────────────
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: "Nama kategori diperlukan dan harus berupa text" });
    }

    const category = await prisma.category.create({ data: { name: sanitizeInput(name) } });
    return res.status(201).json(category);
  } catch (error) {
    console.error("[categories/create]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── DELETE /api/categories/:id (admin) ───────────────────────
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });

    const hasProducts = await prisma.product.count({ where: { categoryId: id } });
    if (hasProducts > 0) {
      return res.status(400).json({ message: 'Kategori tidak dapat dihapus karena masih memiliki produk' });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error("[categories/delete]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
