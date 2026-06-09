import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/authStore';

// Components & Layouts
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';

// Store Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentStatus from './pages/PaymentStatus';
import Profile from './pages/Profile';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';

// Admin Pages
import Dashboard from './pages/Dashboard';
import DashboardProducts from './pages/DashboardProducts';
import DashboardCategories from './pages/DashboardCategories';
import DashboardOrders from './pages/DashboardOrders';
import DashboardNews from './pages/DashboardNews';

export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Run session check on startup
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        {/* Public Storefront Routes */}
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

        {/* Protected Admin Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<DashboardProducts />} />
          <Route path="categories" element={<DashboardCategories />} />
          <Route path="orders" element={<DashboardOrders />} />
          <Route path="news" element={<DashboardNews />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
