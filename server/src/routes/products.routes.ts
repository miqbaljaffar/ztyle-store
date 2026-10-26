import { Router, Request, Response } from 'express';
import { z } from 'zod';

import prisma from '../lib/prisma';
import { sanitizeInput } from '../lib/sanitizer';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth';
import { productSchema, updateProductSchema } from '../schemas';

const router = Router();

// ─── GET /api/products ────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const pageVal = parseInt(req.query.page as string || '1', 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;

    const limitVal = parseInt(req.query.limit as string || '9', 10);
    const limit = isNaN(limitVal) || limitVal < 1 ? 9 : limitVal;

    const skip = (page - 1) * limit;
    const query = req.query.query as string | undefined;

    let categoryIds: number[] = [];
    if (req.query.categoryId) {
      const raw = Array.isArray(req.query.categoryId) ? req.query.categoryId : [req.query.categoryId];
      categoryIds = (raw as string[]).map(Number).filter((n) => !isNaN(n));
    }

    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
    const sort = (req.query.sort as string) || 'newest';

    const where: any = {};
    if (query) where.name = { contains: query, mode: 'insensitive' };
    if (categoryIds.length > 0) where.categoryId = { in: categoryIds };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && !isNaN(minPrice) && minPrice >= 0) where.price.gte = minPrice;
      if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) where.price.lte = maxPrice;
    }

    const orderBy: any =
      sort === 'price-asc' ? { price: 'asc' }
      : sort === 'price-desc' ? { price: 'desc' }
      : sort === 'popularity' ? { reviews: { _count: 'desc' } }
      : { createdAt: 'desc' };

    const [totalProducts, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true, _count: { select: { reviews: true } } },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return res.json({
      products: products.map((p) => ({ ...p, price: Number(p.price) })),
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("[products/list]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── GET /api/products/:id ────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    const relatedProducts = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: id } },
      take: 8,
    });

    const totalReviews = product.reviews.length;
    const averageRating =
      totalReviews > 0
        ? product.reviews.reduce((acc, r: any) => acc + r.rating, 0) / totalReviews
        : 0;

    return res.json({
      ...product,
      price: Number(product.price),
      relatedProducts: relatedProducts.map((p) => ({ ...p, price: Number(p.price) })),
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
    });
  } catch (error) {
    console.error("[products/detail]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── POST /api/products (admin) ───────────────────────────────
router.post('/', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        stock: data.stock,
        imageUrl: data.imageUrl,
        description: data.description ? sanitizeInput(data.description) : undefined,
        categoryId: data.categoryId,
        features: data.features ?? [],
        specifications: data.specifications ?? {},
      },
    });
    return res.status(201).json({ ...product, price: Number(product.price) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[products/create]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PUT /api/products/:id (admin) ────────────────────────────
router.put('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });

    const data = updateProductSchema.parse(req.body);
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        description: data.description ? sanitizeInput(data.description) : undefined,
      },
    });
    return res.json({ ...product, price: Number(product.price) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    console.error("[products/update]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── DELETE /api/products/:id (admin) ────────────────────────
router.delete('/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });

    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error("[products/delete]", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
