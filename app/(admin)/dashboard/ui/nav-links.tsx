'use client';

import {
  HomeIcon,
  ShoppingBagIcon,
  TagIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useEffect } from 'react';
// 1. Impor store notifikasi yang baru dibuat
import { useNotificationStore } from '@/app/store/notification';

const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Products', href: '/dashboard/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/dashboard/categories', icon: TagIcon },
  { name: 'Orders', href: '/dashboard/orders', icon: ClipboardDocumentListIcon },
  { name: 'News', href: '/dashboard/news', icon: ClipboardDocumentListIcon },
];

export default function NavLinks() {
  const pathname = usePathname();
  // 2. Gunakan state dan action dari store Zustand
  const { pendingCount, fetchPendingCount } = useNotificationStore();

  // 3. Ambil data awal saat komponen dimuat (hanya sekali)
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);


  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 relative',
              {
                'bg-sky-100 text-blue-600': pathname === link.href,
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
            
            {/* 4. Tampilkan badge berdasarkan state dari store */}
            {link.name === 'Orders' && pendingCount > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
}