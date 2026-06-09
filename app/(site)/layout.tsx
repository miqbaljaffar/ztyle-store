'use client' 

import Link from 'next/link';
import Image from 'next/image';
import ProfileDropdown from '../ui/ProfileDropdown'; 
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useCartStore } from '@/app/store/cart'; 
import { useEffect, useState } from 'react';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const items = useCartStore((state) => state.items);
  
  // State untuk memastikan render konsisten antara server dan client (menghindari hydration error)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Hitung total item
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link href="/" className="logo">
            <Image src="/Logo.png" alt="Ztyle Logo" width={120} height={45} priority />
          </Link>
          <div className="nav-right-section">
            <ul className="nav-links">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/products">Products</Link></li>
              <li><Link href="/news">News</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
            <Link href="/checkout" className="profile-icon relative">
              <ShoppingCartIcon className="h-8 w-8"/>
              {isClient && totalItems > 0 && (
                <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                  {totalItems}
                </span>
              )}
            </Link>
            <ProfileDropdown />
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Ztyle</h3>
            <p>Jalan Raya No. 123<br />Bandung, West Java 40123<br />Indonesia</p>
          </div>
          <div className="footer-section">
            <h3>Hubungi Kami</h3>
            <p>Email: iqbaljaffar1108@gmail.com</p>
            <p>Telepon: +62 123 456 7890</p>
          </div>
          <div className="footer-section">
            <h3>Ikuti Kami</h3>
            <div className="social-icons" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <a href="https://www.instagram.com/miqbaljaffar_/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FaInstagram size={24} className="social-icon-item" />
              </a>
              <a href="https://www.linkedin.com/in/mohammad-iqbal-jaffar-091939290/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FaLinkedin size={24} className="social-icon-item" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 Ztyle. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}