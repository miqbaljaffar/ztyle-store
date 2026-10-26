"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
// ─── ROUTES ───────────────────────────────────────────────────
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const products_routes_1 = __importDefault(require("./routes/products.routes"));
const categories_routes_1 = __importDefault(require("./routes/categories.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const checkout_routes_1 = __importDefault(require("./routes/checkout.routes"));
const orders_routes_1 = __importDefault(require("./routes/orders.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const reviews_routes_1 = __importDefault(require("./routes/reviews.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
// ─── GUARD: variabel wajib di production ─────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set in production!');
}
// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use((0, cors_1.default)({ origin: FRONTEND_URL, credentials: true }));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// ─── MOUNT ROUTES ────────────────────────────────────────────
app.use('/api/auth', auth_routes_1.default); // register, login, logout, me, forgot/reset-password
app.use('/api/products', products_routes_1.default); // CRUD produk
app.use('/api/categories', categories_routes_1.default); // CRUD kategori
app.use('/api/cart', cart_routes_1.default); // keranjang belanja
app.use('/api/checkout', checkout_routes_1.default); // POST /api/checkout
app.use('/api/orders', orders_routes_1.default); // list, detail, update status pesanan
app.use('/api/profile', profile_routes_1.default); // profil user & riwayat pesanan
app.use('/api/reviews', reviews_routes_1.default); // cek eligibility & buat ulasan
app.use('/api/news', news_routes_1.default); // berita/artikel
app.use('/api/payment', payment_routes_1.default); // Midtrans webhook & snap-token
app.use('/api/dashboard', dashboard_routes_1.default); // statistik admin
// ─── APP LISTENER ─────────────────────────────────────────────
// Di Vercel, app di-export sebagai serverless handler — app.listen() tidak dipanggil.
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`[server] Running on http://localhost:${PORT}`);
    });
}
exports.default = app;
