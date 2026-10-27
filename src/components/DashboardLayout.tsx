import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notification';
import { DashboardSkeleton } from '../ui/skeletons';
import { toast } from 'sonner';
import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/dashboard/categories', icon: TagIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
  { name: 'News', href: '/dashboard/news', icon: ClipboardDocumentListIcon },
];

function NavLinks() {
  const { pathname } = useLocation();
  const { pendingCount, fetchPendingCount } = useNotificationStore();

  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.name}
            to={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-xl bg-gray-50 p-3 text-sm font-semibold hover:bg-blue-50 hover:text-blue-600 md:flex-none md:justify-start md:p-2.5 md:px-4 relative transition-all',
              {
                'bg-blue-50 text-blue-600': isActive,
                'text-gray-500': !isActive,
              }
            )}
          >
            <LinkIcon className="w-5 h-5" />
            <p className="hidden md:block">{link.name}</p>
            {link.name === 'Orders' && pendingCount > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}

function SideNav() {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    toast.success('Anda telah berhasil logout.');
    navigate('/');
  };

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-4 border-r border-gray-100 bg-white">
      <Link
        className="mb-6 flex h-20 items-center justify-center rounded-xl p-4 bg-gray-950 shadow-sm md:h-32"
        to="/"
      >
        <div className="w-28 text-white md:w-32">
          <img src="/Logo.png" alt="Ztyle Logo" className="w-full h-auto object-contain brightness-0 invert" />
        </div>
      </Link>
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        <NavLinks />
        <div className="hidden h-auto w-full grow rounded-xl bg-gray-50/50 border border-dashed border-gray-100 md:block"></div>
        <button
          onClick={handleSignOut}
          className="flex h-[48px] w-full grow items-center justify-center gap-2 rounded-xl bg-gray-50 p-3 text-sm font-semibold hover:bg-red-50 hover:text-red-600 md:flex-none md:justify-start md:p-2.5 md:px-4 text-gray-500 transition-all"
        >
          <PowerIcon className="w-5 h-5" />
          <div className="hidden md:block">Sign Out</div>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'ADMIN') {
        toast.error('Akses ditolak. Halaman ini hanya untuk Admin.');
        navigate('/');
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen justify-center items-center">
        <DashboardSkeleton />
      </div>
    );
  }

  if (user && user.role === 'ADMIN') {
    return (
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-gray-50/50">
        <div className="w-full flex-none md:w-64">
          <SideNav />
        </div>
        <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
          <Outlet />
        </div>
      </div>
    );
  }

  return <DashboardSkeleton />;
}
