'use client';

import { Suspense, lazy, useEffect, useMemo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import { RouteParamsProvider, RouteOutletProvider } from './next-router-compat';
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
  <div className="flex min-h-[400px] items-center justify-center" role="status" aria-label="Memuat halaman">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" aria-hidden="true" />
    <span className="sr-only">Memuat...</span>
  </div>
);

type AppRoute = {
  pattern: RegExp;
  page: ReactNode;
  param?: string;
  dashboard?: boolean;
};

const routes: AppRoute[] = [
  { pattern: /^\/$/, page: <Home /> },
  { pattern: /^\/products$/, page: <Products /> },
  { pattern: /^\/products\/([^/]+)$/, page: <ProductDetail />, param: 'id' },
  { pattern: /^\/news$/, page: <News /> },
  { pattern: /^\/news\/([^/]+)$/, page: <NewsDetail />, param: 'slug' },
  { pattern: /^\/about$/, page: <About /> },
  { pattern: /^\/contact$/, page: <Contact /> },
  { pattern: /^\/checkout$/, page: <Checkout /> },
  { pattern: /^\/payment\/success$/, page: <PaymentSuccess /> },
  { pattern: /^\/payment\/([^/]+)$/, page: <PaymentStatus />, param: 'orderId' },
  { pattern: /^\/profile$/, page: <Profile /> },
  { pattern: /^\/login$/, page: <Login /> },
  { pattern: /^\/register$/, page: <Register /> },
  { pattern: /^\/forgot-password$/, page: <ForgotPassword /> },
  { pattern: /^\/reset-password$/, page: <ResetPassword /> },
  { pattern: /^\/verify-email$/, page: <VerifyEmail /> },
  { pattern: /^\/dashboard$/, page: <Dashboard />, dashboard: true },
  { pattern: /^\/dashboard\/products$/, page: <DashboardProducts />, dashboard: true },
  { pattern: /^\/dashboard\/categories$/, page: <DashboardCategories />, dashboard: true },
  { pattern: /^\/dashboard\/orders$/, page: <DashboardOrders />, dashboard: true },
  { pattern: /^\/dashboard\/news$/, page: <DashboardNews />, dashboard: true },
];

export default function App() {
  const pathname = usePathname() ?? '';
  const checkSession = useAuthStore((state) => state.checkSession);
  const route = useMemo(() => routes.find((candidate) => candidate.pattern.test(pathname)), [pathname]);
  const match = route?.pattern.exec(pathname);
  const params = route?.param && match?.[1] ? { [route.param]: decodeURIComponent(match[1]) } : {};

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const page = route ? (
    <RouteParamsProvider value={params}>
      <Suspense fallback={<PageFallback />}>{route.page}</Suspense>
    </RouteParamsProvider>
  ) : (
    <main className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-gray-600">Halaman yang Anda cari tidak tersedia.</p>
    </main>
  );

  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      {route?.dashboard ? (
        <RouteOutletProvider value={page}>
          <DashboardLayout />
        </RouteOutletProvider>
      ) : (
        <RouteOutletProvider value={page}>
          <Layout />
        </RouteOutletProvider>
      )}
    </>
  );
}
