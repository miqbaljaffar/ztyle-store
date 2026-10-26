import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// ─── ROUTES ───────────────────────────────────────────────────
import authRouter from './routes/auth.routes';
import productsRouter from './routes/products.routes';
import categoriesRouter from './routes/categories.routes';
import cartRouter from './routes/cart.routes';
import checkoutRouter from './routes/checkout.routes';
import ordersRouter from './routes/orders.routes';
import profileRouter from './routes/profile.routes';
import reviewsRouter from './routes/reviews.routes';
import newsRouter from './routes/news.routes';
import paymentRouter from './routes/payment.routes';
import dashboardRouter from './routes/dashboard.routes';

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

// ─── GUARD: variabel wajib di production ─────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set in production!');
}

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ─── MOUNT ROUTES ────────────────────────────────────────────
app.use('/api/auth',      authRouter);        // register, login, logout, me, forgot/reset-password
app.use('/api/products',  productsRouter);    // CRUD produk
app.use('/api/categories',categoriesRouter);  // CRUD kategori
app.use('/api/cart',      cartRouter);        // keranjang belanja
app.use('/api/checkout',  checkoutRouter);    // POST /api/checkout
app.use('/api/orders',    ordersRouter);      // list, detail, update status pesanan
app.use('/api/profile',   profileRouter);     // profil user & riwayat pesanan
app.use('/api/reviews',   reviewsRouter);     // cek eligibility & buat ulasan
app.use('/api/news',      newsRouter);        // berita/artikel
app.use('/api/payment',   paymentRouter);     // Midtrans webhook & snap-token
app.use('/api/dashboard', dashboardRouter);   // statistik admin

// ─── APP LISTENER ─────────────────────────────────────────────
// Di Vercel, app di-export sebagai serverless handler — app.listen() tidak dipanggil.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[server] Running on http://localhost:${PORT}`);
  });
}

export default app;
