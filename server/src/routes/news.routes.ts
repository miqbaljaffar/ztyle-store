import { Router, Request, Response } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma';
import { sanitizeInput } from '../lib/sanitizer';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { newsSchema, updateNewsSchema } from '../schemas';

const router = Router();

// ─── GET /api/news ────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [news, totalNews] = await Promise.all([
      prisma.news.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
      prisma.news.count(),
    ]);

    return res.json({ news, totalPages: Math.ceil(totalNews / limit), currentPage: page });
  } catch (error) {
    console.error("[news/list]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/news/slug/:slug ─────────────────────────────────
// PENTING: route ini harus didefinisikan SEBELUM /api/news/:id
// agar Express tidak menganggap "slug" sebagai nilai :id
router.get('/slug/:slug', async (req: Request, res: Response) => {
  try {
    const item = await prisma.news.findUnique({ where: { slug: req.params.slug } });
    if (!item) return res.status(404).json({ message: 'News article not found' });
    return res.json(item);
  } catch (error) {
    console.error("[news/slug]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/news/:id ────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    const item = await prisma.news.findUnique({ where: { id } });
    if (!item) return res.status(404).json({ message: 'News article not found' });
    return res.json(item);
  } catch (error) {
    console.error("[news/detail]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/news (admin) ───────────────────────────────────
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const data = newsSchema.parse(req.body);
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const item = await prisma.news.create({
      data: {
        title: data.title,
        excerpt: data.excerpt,
        content: sanitizeInput(data.content),
        imageUrl: data.imageUrl,
        author: data.author,
        slug,
      },
    });

    return res.status(201).json(item);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[news/create]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PUT /api/news/:id (admin) ────────────────────────────────
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    const data = updateNewsSchema.parse(req.body);
    const item = await prisma.news.update({
      where: { id },
      data: {
        ...data,
        content: data.content ? sanitizeInput(data.content) : undefined,
      },
    });

    return res.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[news/update]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── DELETE /api/news/:id (admin) ────────────────────────────
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    await prisma.news.delete({ where: { id } });
    return res.json({ message: 'Berita berhasil dihapus' });
  } catch (error) {
    console.error("[news/delete]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
