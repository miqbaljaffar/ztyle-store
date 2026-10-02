import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import Home from './pages/Home';

const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Checkout = lazy(() => import('./pages/Checkout'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentStatus = lazy(() => import('./pages/PaymentStatus'));
const Profile = lazy(() => import('./pages/Profile'));

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const DashboardProducts = lazy(() => import('./pages/DashboardProducts'));
const DashboardCategories = lazy(() => import('./pages/DashboardCategories'));
const DashboardOrders = lazy(() => import('./pages/DashboardOrders'));
const DashboardNews = lazy(() => import('./pages/DashboardNews'));

const PageFallback = () => (
  <div
    className="flex min-h-[400px] items-center justify-center"
    role="status"
    aria-label="Memuat halaman"
  >
    <div
      className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
      aria-hidden="true"
    />
    <span className="sr-only">Memuat...</span>
  </div>
);

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="news" element={<News />} />
            <Route path="news/:slug" element={<NewsDetail />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/:orderId" element={<PaymentStatus />} />
            <Route path="profile" element={<Profile />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="verify-email" element={<VerifyEmail />} />
          </Route>

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<DashboardProducts />} />
            <Route path="categories" element={<DashboardCategories />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="news" element={<DashboardNews />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
