import { z } from 'zod';

// ─── AUTH SCHEMAS ─────────────────────────────────────────────
export const userRegisterSchema = z.object({
  name: z.string().min(3, "Nama harus lebih dari 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal harus 6 karakter."),
});

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token diperlukan."),
    password: z.string().min(6, "Password minimal harus 6 karakter."),
    confirmPassword: z.string().min(6, "Konfirmasi password minimal harus 6 karakter."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak cocok.",
    path: ["confirmPassword"],
  });

// ─── PRODUCT SCHEMAS ──────────────────────────────────────────
export const productSchema = z.object({
  name: z.string().min(3, { message: "Nama produk harus memiliki setidaknya 3 karakter" }),
  price: z.number().positive({ message: "Harga harus bernilai positif" }),
  stock: z.number().int().nonnegative({ message: "Stok tidak boleh negatif" }),
  categoryId: z.number().int().positive({ message: "Kategori ID tidak valid" }),
  imageUrl: z.string().min(1, { message: "URL gambar diperlukan" }),
  description: z.string().optional(),
  features: z.array(z.string()).optional(),
  specifications: z.record(z.any()).optional(),
});

export const updateProductSchema = productSchema.partial();

// ─── NEWS SCHEMAS ─────────────────────────────────────────────
export const newsSchema = z.object({
  title: z.string().min(5, { message: "Judul berita harus memiliki setidaknya 5 karakter" }),
  excerpt: z.string().min(10, { message: "Kutipan berita harus memiliki setidaknya 10 karakter" }),
  content: z.string().min(20, { message: "Konten berita harus memiliki setidaknya 20 karakter" }),
  imageUrl: z.string().min(1, { message: "URL gambar berita diperlukan" }),
  author: z.string().min(3, { message: "Nama penulis harus memiliki setidaknya 3 karakter" }),
});

export const updateNewsSchema = newsSchema.partial().extend({
  slug: z.string().optional(),
});

// ─── PROFILE SCHEMAS ──────────────────────────────────────────
export const profileSchema = z.object({
  name: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter.").max(50),
  phoneNumber: z.string().max(15).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

// ─── REVIEW SCHEMAS ───────────────────────────────────────────
export const reviewSchema = z.object({
  productId: z.number(),
  orderItemId: z.number(),
  rating: z.number().min(1, "Rating harus diisi").max(5),
  comment: z.string().min(10, "Komentar minimal harus 10 karakter."),
});
