import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import { hash, compare } from 'bcrypt';
import crypto from 'crypto';
import multer from 'multer';
import { put } from '@vercel/blob';
import { z } from 'zod';

import prisma from './lib/prisma';
import { sendVerificationEmail, sendPasswordResetEmail } from './lib/mail';
import { createSnapTransaction } from './lib/midtrans';
import { sanitizeInput } from './lib/sanitizer';
import { authenticateJWT, AuthRequest, requireRole } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ztyle-secret-key-12345';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Multer in-memory storage for handling vercel blob upload
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Zod schemas
const userRegisterSchema = z.object({
  name: z.string().min(3, "Nama harus lebih dari 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal harus 6 karakter."),
});

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string(),
});

const productSchema = z.object({
  name: z.string().min(3, { message: "Nama produk harus memiliki setidaknya 3 karakter" }),
  price: z.number().positive({ message: "Harga harus bernilai positif" }),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }),
  categoryId: z.number().int().positive({ message: "Kategori ID tidak valid" }),
  imageUrl: z.string().min(1, { message: "URL gambar diperlukan" }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(), 
  specifications: z.record(z.any()).optional(), 
});

const updateProductSchema = z.object({
  name: z.string().min(3, { message: "Nama produk harus memiliki setidaknya 3 karakter" }).optional(),
  price: z.number().positive({ message: "Harga harus bernilai positif" }).optional(),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }).optional(),
  categoryId: z.number().int().positive({ message: "Kategori ID tidak valid" }).optional(),
  imageUrl: z.string().min(1, { message: "URL gambar diperlukan" }).optional(),
  description: z.string().optional(),
  features: z.array(z.string()).optional(), 
  specifications: z.record(z.any()).optional(), 
});

const newsSchema = z.object({
  title: z.string().min(5, { message: "Judul berita harus memiliki setidaknya 5 karakter" }),
  excerpt: z.string().min(10, { message: "Kutipan berita harus memiliki setidaknya 10 karakter" }),
  content: z.string().min(20, { message: "Konten berita harus memiliki setidaknya 20 karakter" }),
  imageUrl: z.string().min(1, { message: "URL gambar berita diperlukan" }),
  author: z.string().min(3, { message: "Nama penulis harus memiliki setidaknya 3 karakter" }),
});

const updateNewsSchema = z.object({
  title: z.string().min(5, { message: "Judul berita harus memiliki setidaknya 5 karakter" }).optional(),
  excerpt: z.string().min(10, { message: "Kutipan berita harus memiliki setidaknya 10 karakter" }).optional(),
  content: z.string().min(20, { message: "Konten berita harus memiliki setidaknya 20 karakter" }).optional(),
  imageUrl: z.string().min(1, { message: "URL gambar berita diperlukan" }).optional(),
  author: z.string().min(3, { message: "Nama penulis harus memiliki setidaknya 3 karakter" }).optional(),
  slug: z.string().optional(),
});

const profileSchema = z.object({
  name: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter.").max(50),
  phoneNumber: z.string().max(15).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

const reviewSchema = z.object({
  productId: z.number(),
  orderItemId: z.number(),
  rating: z.number().min(1, "Rating harus diisi").max(5),
  comment: z.string().min(10, "Komentar minimal harus 10 karakter."),
});

// Helper for verification token creation
async function createAndSendToken(email: string) {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { email } });
  await prisma.verificationToken.create({
    data: { email, token, expires },
  });

  await sendVerificationEmail(email, token);
}

async function createAndSendPasswordResetToken(email: string) {
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  await prisma.verificationToken.deleteMany({ where: { email } });
  await prisma.verificationToken.create({
    data: { email, token, expires },
  });

  await sendPasswordResetEmail(email, token);
}

// ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────

// POST /api/auth/register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const validatedData = userRegisterSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      if (!existingUser.emailVerified) {
        await createAndSendToken(validatedData.email);
        return res.json({ message: "Email sudah terdaftar tapi belum diverifikasi. Kami telah mengirim ulang kode OTP." });
      }
      return res.status(409).json({ message: "Email sudah terdaftar dan terverifikasi." });
    }

    const hashedPassword = await hash(validatedData.password, 10);
    await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        emailVerified: null,
      }
    });

    await createAndSendToken(validatedData.email);
    return res.status(201).json({ message: "Registrasi berhasil! Silakan cek email Anda untuk kode verifikasi." });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Gagal saat registrasi:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/verify-email
app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token tidak ditemukan.' });

    const verificationToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (!verificationToken) return res.status(400).json({ message: 'Kode OTP tidak valid.' });

    const hasExpired = new Date(verificationToken.expires) < new Date();
    if (hasExpired) return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });

    const user = await prisma.user.findUnique({ where: { email: verificationToken.email } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    return res.json({ message: 'Verifikasi email berhasil!' });
  } catch (error) {
    console.error("Gagal verifikasi email:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ message: 'Email belum diverifikasi. Silakan cek email Anda.' });
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email atau password salah.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax',
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        phoneNumber: user.phoneNumber,
        address: user.address,
      },
      token,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Gagal login:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.json({ message: 'Logout berhasil' });
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        image: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error("Gagal ambil data user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email diperlukan.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.json({ message: "Jika email Anda terdaftar, kami telah mengirimkan instruksi reset password." });
    }

    await createAndSendPasswordResetToken(email);
    return res.json({ message: "Jika email Anda terdaftar, kami telah mengirimkan instruksi reset password." });
  } catch (error) {
    console.error("Gagal saat proses lupa password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/auth/reset-password
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const resetSchema = z.object({
      token: z.string().min(1, "Token diperlukan."),
      password: z.string().min(6, "Password minimal harus 6 karakter."),
      confirmPassword: z.string().min(6, "Konfirmasi password minimal harus 6 karakter."),
    }).refine(data => data.password === data.confirmPassword, {
      message: "Password dan konfirmasi password tidak cocok.",
      path: ["confirmPassword"], 
    });

    const validatedData = resetSchema.parse(req.body);
    const { token, password } = validatedData;

    const verificationToken = await prisma.verificationToken.findUnique({ where: { token } });
    if (!verificationToken) return res.status(400).json({ message: 'Kode OTP tidak valid.' });

    const hasExpired = new Date(verificationToken.expires) < new Date();
    if (hasExpired) return res.status(400).json({ message: 'Kode OTP sudah kedaluwarsa.' });

    const user = await prisma.user.findUnique({ where: { email: verificationToken.email } });
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });

    const hashedPassword = await hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.verificationToken.delete({ where: { id: verificationToken.id } });
    return res.json({ message: 'Password berhasil direset! Anda akan diarahkan ke halaman login.' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Gagal reset password:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PRODUCT ENDPOINTS ──────────────────────────────────────────────────────

// GET /api/products
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const pageVal = parseInt(req.query.page as string || '1', 10);
    const page = isNaN(pageVal) || pageVal < 1 ? 1 : pageVal;
    
    const limitVal = parseInt(req.query.limit as string || '9', 10);
    const limit = isNaN(limitVal) || limitVal < 1 ? 9 : limitVal;
    
    const skip = (page - 1) * limit;

    const query = req.query.query as string || undefined;
    
    let categoryIds: number[] = [];
    if (req.query.categoryId) {
      if (Array.isArray(req.query.categoryId)) {
        categoryIds = req.query.categoryId.map((id: any) => parseInt(id as string, 10)).filter((id: number) => !isNaN(id));
      } else {
        categoryIds = [parseInt(req.query.categoryId as string, 10)].filter((id: number) => !isNaN(id));
      }
    }

    let minPrice: number | undefined = undefined;
    if (req.query.minPrice) {
      const parsed = parseFloat(req.query.minPrice as string);
      if (!isNaN(parsed) && parsed >= 0) minPrice = parsed;
    }

    let maxPrice: number | undefined = undefined;
    if (req.query.maxPrice) {
      const parsed = parseFloat(req.query.maxPrice as string);
      if (!isNaN(parsed) && parsed >= 0) maxPrice = parsed;
    }

    const sort = req.query.sort as string || 'newest';

    const where: any = {};
    if (query) { where.name = { contains: query, mode: 'insensitive' }; }
    if (categoryIds.length > 0) { where.categoryId = { in: categoryIds }; }
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) { where.price.gte = minPrice; }
      if (maxPrice !== undefined && maxPrice > 0) { where.price.lte = maxPrice; }
    }
    
    const orderBy: any = {};
    if (sort === 'price-asc') { orderBy.price = 'asc'; } 
    else if (sort === 'price-desc') { orderBy.price = 'desc'; } 
    else if (sort === 'popularity') { orderBy.reviews = { _count: 'desc' }; } 
    else { orderBy.createdAt = 'desc'; }

    const totalProducts = await prisma.product.count({ where });
    const products = await prisma.product.findMany({
      where,
      include: { category: true, _count: { select: { reviews: true } } },
      orderBy, 
      skip,
      take: limit,
    });

    const productsWithNumberPrice = products.map(p => ({
      ...p,
      price: Number(p.price)
    }));
    
    return res.json({
      products: productsWithNumberPrice,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, reviews: { include: { user: { select: { name: true, image: true } } }, orderBy: { createdAt: 'desc' } } },
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Fetch related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: id },
      },
      take: 8,
    });

    const relatedProductsWithNumberPrice = relatedProducts.map(p => ({
      ...p,
      price: Number(p.price)
    }));

    const totalReviews = product.reviews.length;
    const averageRating =
      totalReviews > 0
        ? product.reviews.reduce((acc: number, review: any) => acc + review.rating, 0) / totalReviews
        : 0;

    return res.json({
      ...product,
      price: Number(product.price),
      relatedProducts: relatedProductsWithNumberPrice,
      totalReviews,
      averageRating: parseFloat(averageRating.toFixed(1))
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/products (admin only)
app.post('/api/products', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = productSchema.parse(req.body);

    const newProduct = await prisma.product.create({
      data: {
        name: validatedData.name,
        price: validatedData.price,
        stock: validatedData.stock,
        imageUrl: validatedData.imageUrl,
        description: validatedData.description ? sanitizeInput(validatedData.description) : undefined,
        categoryId: validatedData.categoryId,
        features: validatedData.features || [], 
        specifications: validatedData.specifications || {},
      },
    });

    return res.status(201).json({ ...newProduct, price: Number(newProduct.price) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Failed to create product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/products/:id (admin only)
app.put('/api/products/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });

    const validatedData = updateProductSchema.parse(req.body);

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: validatedData.name,
        price: validatedData.price,
        stock: validatedData.stock,
        imageUrl: validatedData.imageUrl,
        description: validatedData.description ? sanitizeInput(validatedData.description) : undefined,
        categoryId: validatedData.categoryId,
        features: validatedData.features, 
        specifications: validatedData.specifications, 
      },
    });

    return res.json({ ...updatedProduct, price: Number(updatedProduct.price) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Failed to update product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/products/:id (admin only)
app.delete('/api/products/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid product ID' });
    
    await prisma.product.delete({ where: { id } });
    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── CATEGORY ENDPOINTS ─────────────────────────────────────────────────────

// GET /api/categories
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [categories, totalCategories] = await Promise.all([
      prisma.category.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      prisma.category.count(),
    ]);

    return res.json({
      categories,
      totalPages: Math.ceil(totalCategories / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Gagal mengambil kategori:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/categories (admin only)
app.post('/api/categories', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: "Nama kategori diperlukan dan harus berupa text" });
    }
    const sanitizedName = sanitizeInput(name);
    const newCategory = await prisma.category.create({
      data: { name: sanitizedName },
    });
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error("Gagal membuat kategori:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/categories/:id (admin only)
app.delete('/api/categories/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });

    const productsInCategory = await prisma.product.count({ where: { categoryId: id } });
    if (productsInCategory > 0) {
      return res.status(400).json({ message: 'Kategori tidak dapat dihapus karena masih memiliki produk' });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── CART ENDPOINTS ─────────────────────────────────────────────────────────

async function getOrCreateCart(userId: number) {
  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { userId } });
  }
  return cart;
}

// GET /api/cart
app.get('/api/cart', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || !cart.items) return res.json([]);
    return res.json(cart.items);
  } catch (error) {
    console.error("Gagal mengambil item keranjang:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/cart
app.post('/api/cart', authenticateJWT, async (req: AuthRequest, res: Response) => {
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

    const cartItem = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { cartId: cart.id, productId, quantity },
    });

    return res.json(cartItem);
  } catch (error) {
    console.error("Gagal melakukan upsert ke keranjang:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/cart
app.put('/api/cart', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { productId, quantity } = req.body;
    if (productId === undefined || quantity === undefined) {
      return res.status(400).json({ message: 'Data tidak lengkap' });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) return res.status(404).json({ message: 'Keranjang tidak ditemukan' });

    if (quantity <= 0) {
      await prisma.cartItem.delete({
        where: { cartId_productId: { cartId: cart.id, productId } },
      });
      return res.json({ message: 'Item dihapus' });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { cartId_productId: { cartId: cart.id, productId } },
      data: { quantity },
      include: { product: true }
    });

    return res.json(updatedItem);
  } catch (error) {
    console.error("Gagal mengupdate item keranjang:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── CHECKOUT & ORDER ENDPOINTS ─────────────────────────────────────────────

// POST /api/checkout
app.post('/api/checkout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const userId = req.user.id;
    const { shippingAddress, items } = req.body;

    if (!shippingAddress) return res.status(400).json({ message: "Alamat pengiriman wajib diisi." });
    if (!items || items.length === 0) return res.status(400).json({ message: "Keranjang belanja kosong." });

    const productIds = items.map((item: any) => item.productId);
    const productsFromDb = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    
    const productMap = new Map<number, any>(
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
      if (!product) throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      totalAmount += product.price * item.quantity;
    }

    const order = await prisma.$transaction(async (tx) => {
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

    const midtransOrderId = `ZTYLE-${order.id}-${Date.now()}`;

    const itemDetails = order.items.map((item: any) => ({
      id: String(item.productId),
      price: Math.round(Number(item.price)),
      quantity: item.quantity,
      name: item.product.name.substring(0, 50),
    }));

    const snapToken = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount: Math.round(totalAmount),
      itemDetails,
      customerDetails: {
        first_name: req.user.name || 'Pelanggan',
        email: req.user.email || '',
      },
    });

    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { snapToken, midtransOrderId },
    });

    // Clear cart after checkout
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return res.status(201).json({ ...updatedOrder, snapToken });
  } catch (error: any) {
    console.error("Gagal membuat pesanan:", error);
    if (error.message.startsWith('Stok untuk produk') || error.message.startsWith('Produk dengan ID')) {
       return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/orders/all (admin only)
app.get('/api/orders/all', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, totalOrders] = await Promise.all([
      prisma.order.findMany({
        include: {
          user: { select: { name: true, email: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count(),
    ]);
    
    return res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/orders/pending-count (admin only)
app.get('/api/orders/pending-count', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const pendingCount = await prisma.order.count({
      where: { status: 'WAITING_CONFIRMATION' },
    });
    return res.json({ count: pendingCount });
  } catch (error) {
    console.error("Gagal mengambil jumlah pesanan pending:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const id = parseInt(req.params.id);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!order || (order.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ message: 'Order not found or not authorized' });
    }
    
    return res.json(order);
  } catch (error) {
    console.error("Gagal mengambil pesanan:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// PUT /api/orders/:id (admin update status)
app.put('/api/orders/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!status) return res.status(400).json({ message: 'Status diperlukan' });

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
    });
    return res.json(updatedOrder);
  } catch (error) {
    console.error("Gagal mengupdate status pesanan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── PROFILE ENDPOINTS ──────────────────────────────────────────────────────

// GET /api/profile
app.get('/api/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json(user);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/profile
app.put('/api/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const validatedData = profileSchema.parse(req.body);

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: validatedData.name,
        phoneNumber: validatedData.phoneNumber,
        address: validatedData.address,
      },
    });
    
    const { password, ...result } = updatedUser;
    return res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Failed to update profile:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/profile/orders
app.get('/api/profile/orders', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true, id: true } }
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(orders);
  } catch (error) {
    console.error("Gagal mengambil riwayat pesanan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/reviews/check
app.get('/api/reviews/check', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const productId = parseInt(req.query.productId as string, 10);
    const orderItemId = parseInt(req.query.orderItemId as string, 10);

    if (isNaN(productId) || isNaN(orderItemId)) {
      return res.json({ canReview: false });
    }

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        productId: productId,
        order: { userId: req.user.id, status: { in: ['PAID', 'DELIVERED'] } },
        reviewId: null,
      },
    });

    return res.json({ canReview: !!orderItem });
  } catch (error) {
    console.error("Gagal memeriksa status ulasan:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/reviews
app.post('/api/reviews', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const validatedData = reviewSchema.parse(req.body);
    const userId = req.user.id;

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: validatedData.orderItemId,
        productId: validatedData.productId,
        order: {
          userId,
          status: { in: ['DELIVERED', 'PAID'] }
        },
        reviewId: null
      }
    });

    if (!orderItem) {
      return res.status(403).json({ message: "Anda tidak dapat memberikan ulasan untuk produk ini atau ulasan sudah ada." });
    }
    
    const newReview = await prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          rating: validatedData.rating,
          comment: validatedData.comment,
          userId,
          productId: validatedData.productId,
        },
      });

      await tx.orderItem.update({
        where: { id: orderItem.id },
        data: { reviewId: createdReview.id },
      });

      return createdReview;
    }, {
      maxWait: 15000,
      timeout: 30000, 
    });

    return res.status(201).json(newReview);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.flatten().fieldErrors });
    }
    console.error("Gagal membuat review:", error);
    if ((error as any).code === 'P2028') {
        return res.status(504).json({ message: "Proses terlalu lama, transaksi timeout. Coba lagi." });
    }
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── NEWS ENDPOINTS ─────────────────────────────────────────────────────────

// GET /api/news
app.get('/api/news', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1');
    const limit = 10;
    const skip = (page - 1) * limit;

    const [news, totalNews] = await Promise.all([
      prisma.news.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.news.count(),
    ]);
    
    return res.json({
      news,
      totalPages: Math.ceil(totalNews / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Gagal mengambil berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/news/slug/:slug
app.get('/api/news/slug/:slug', async (req: Request, res: Response) => {
  try {
    const newsItem = await prisma.news.findUnique({
      where: { slug: req.params.slug },
    });
    if (!newsItem) return res.status(404).json({ message: 'News article not found' });
    return res.json(newsItem);
  } catch (error) {
    console.error("Gagal mengambil detail berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// GET /api/news/:id
app.get('/api/news/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    const newsItem = await prisma.news.findUnique({ where: { id } });
    if (!newsItem) return res.status(404).json({ message: 'News article not found' });
    return res.json(newsItem);
  } catch (error) {
    console.error("Gagal mengambil berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// POST /api/news (admin only)
app.post('/api/news', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = newsSchema.parse(req.body);
    const slug = validatedData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');

    const newNews = await prisma.news.create({
      data: {
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content ? sanitizeInput(validatedData.content) : '',
        imageUrl: validatedData.imageUrl,
        author: validatedData.author,
        slug,
      },
    });

    return res.status(201).json(newNews);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Gagal membuat berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// PUT /api/news/:id (admin only)
app.put('/api/news/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    const validatedData = updateNewsSchema.parse(req.body);

    const updatedNews = await prisma.news.update({
      where: { id },
      data: {
        title: validatedData.title,
        excerpt: validatedData.excerpt,
        content: validatedData.content ? sanitizeInput(validatedData.content) : undefined,
        imageUrl: validatedData.imageUrl,
        author: validatedData.author,
        slug: validatedData.slug,
      },
    });

    return res.json(updatedNews);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Input tidak valid", errors: error.errors });
    }
    console.error("Gagal mengupdate berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// DELETE /api/news/:id (admin only)
app.delete('/api/news/:id', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid news ID' });

    await prisma.news.delete({ where: { id } });
    return res.json({ message: 'Berita berhasil dihapus' });
  } catch (error) {
    console.error("Gagal menghapus berita:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// ─── WEBHOOKS & WEB UTILS ───────────────────────────────────────────────────

// POST /api/payment/notification
app.post('/api/payment/notification', async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = req.body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex');

    if (signature_key !== expectedSignature) {
      console.warn('[Midtrans Webhook] Invalid signature for order:', order_id);
      return res.status(403).json({ message: 'Invalid signature' });
    }

    const order = await prisma.order.findUnique({
      where: { midtransOrderId: order_id },
      include: { items: true },
    });

    if (!order) {
      console.warn('[Midtrans Webhook] Order tidak ditemukan:', order_id);
      return res.json({ message: 'Order tidak ditemukan' });
    }

    let newStatus: string | null = null;

    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      if (fraud_status === 'accept' || !fraud_status) {
        newStatus = 'PAID';
      }
    } else if (transaction_status === 'pending') {
      newStatus = null;
    } else if (
      transaction_status === 'deny' ||
      transaction_status === 'cancel' ||
      transaction_status === 'expire'
    ) {
      newStatus = 'CANCELLED';
    }

    if (newStatus === null) {
      return res.json({ message: 'Status tidak memerlukan update' });
    }

    if (order.status === newStatus) {
      return res.json({ message: 'Status sudah up-to-date' });
    }

    if (newStatus === 'CANCELLED' && order.status === 'PENDING') {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: newStatus as string },
        });

        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus },
      });
    }

    console.log(`[Midtrans Webhook] Order #${order.id} status updated: ${order.status} → ${newStatus}`);
    return res.json({ message: 'OK' });
  } catch (error) {
    console.error('[Midtrans Webhook] Error:', error);
    return res.json({ message: 'Internal Server Error' });
  }
});

// GET /api/payment/snap-token/:orderId
app.get('/api/payment/snap-token/:orderId', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const orderId = parseInt(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, status: true, snapToken: true, totalAmount: true },
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ message: 'Order tidak ditemukan' });
    }

    return res.json({
      snapToken: order.snapToken,
      status: order.status,
      totalAmount: order.totalAmount,
    });
  } catch (error) {
    console.error('[snap-token] Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// POST /api/upload
app.post('/api/upload', authenticateJWT, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah.' });
  }

  try {
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
      addRandomSuffix: true,
    });

    console.log(`File berhasil diunggah ke Vercel Blob. URL: ${blob.url}`);
    return res.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("Gagal mengunggah ke Vercel Blob:", error);
    return res.status(500).json({ success: false, message: 'Gagal memproses file di server.' });
  }
});

// GET /api/dashboard/stats (admin only)
app.get('/api/dashboard/stats', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [
      totalRevenueAggr,
      totalSalesAggr,
      totalCustomersCount,
      totalProductsCount,
      topSalesGrouped,
      newCustomersThisYear,
      paidOrdersThisYear
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { totalAmount: true }
      }),
      prisma.orderItem.aggregate({
        where: { order: { status: 'PAID' } },
        _sum: { quantity: true }
      }),
      prisma.user.count({
        where: { role: 'CUSTOMER' }
      }),
      prisma.product.count(),
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { status: 'PAID' } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.user.findMany({
        where: { role: 'CUSTOMER', createdAt: { gte: startOfYear } },
        select: { createdAt: true }
      }),
      prisma.order.findMany({
        where: { status: 'PAID', createdAt: { gte: startOfYear } },
        select: {
          createdAt: true,
          items: { select: { quantity: true } }
        }
      })
    ]);

    const totalRevenue = totalRevenueAggr._sum.totalAmount || 0;
    const totalSales = totalSalesAggr._sum.quantity || 0;

    const topProductIds = topSalesGrouped.map(item => item.productId);
    const topProductsInfo = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true }
    });

    const bestSellingProducts = topSalesGrouped.map(sale => {
      const prodInfo = topProductsInfo.find(p => p.id === sale.productId);
      return {
        name: prodInfo?.name || `Produk #${sale.productId}`,
        sales: sale._sum.quantity || 0
      };
    });

    // Helper functions for month grouping
    const getMonthlySalesData = (orders: any[]) => {
      const salesByMonth: { [key: string]: number } = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

      orders.forEach(order => {
        const month = new Date(order.createdAt).getMonth(); 
        const monthName = monthNames[month];
        const totalItems = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
        salesByMonth[monthName] = (salesByMonth[monthName] || 0) + totalItems;
      });
      return monthNames.map(month => ({ name: month, sales: salesByMonth[month] || 0 }));
    };

    const getNewCustomersData = (users: any[]) => {
      const customersByMonth: { [key: string]: number } = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
      const usersThisYear = users.filter(user => new Date(user.createdAt).getFullYear() === currentYear);

      usersThisYear.forEach(user => {
        const month = new Date(user.createdAt).getMonth();
        const monthName = monthNames[month];
        customersByMonth[monthName] = (customersByMonth[monthName] || 0) + 1;
      });
      return monthNames.map(month => ({ name: month, customers: customersByMonth[month] || 0 }));
    };

    const salesChartData = getMonthlySalesData(paidOrdersThisYear);
    const newCustomersChartData = getNewCustomersData(newCustomersThisYear);

    return res.json({
      totalRevenue,
      totalSales,
      totalCustomers: totalCustomersCount,
      totalProducts: totalProductsCount,
      salesChartData,
      bestSellingProducts,
      newCustomersChartData,
    });
  } catch (error) {
    console.error("Gagal mengambil data statistik dashboard:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

// App listener
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
