import { Link, NavLink, Outlet } from 'react-router-dom';
import ProfileDropdown from '../ui/ProfileDropdown';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useCartStore } from '../store/cart';

export default function Layout() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[1000] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow-lg">
        Lompat ke konten utama
      </a>
      <header className="header" role="banner">
        <nav className="nav" aria-label="Navigasi utama">
          <Link to="/" className="logo" aria-label="Halaman utama Ztyle Store">
            <img
              src="/Logo.png"
              alt="Ztyle Store - Fashion Premium"
              width={120}
              height={45}
              style={{ objectFit: 'contain' }}
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
          </Link>
          <div className="nav-right-section">
            <ul className="nav-links" role="menubar">
              <li role="none"><NavLink to="/" role="menuitem" end>Home</NavLink></li>
              <li role="none"><NavLink to="/products" role="menuitem">Products</NavLink></li>
              <li role="none"><NavLink to="/news" role="menuitem">News</NavLink></li>
              <li role="none"><NavLink to="/about" role="menuitem">About</NavLink></li>
              <li role="none"><NavLink to="/contact" role="menuitem">Contact</NavLink></li>
            </ul>
            <Link
              to="/checkout"
              className="profile-icon relative"
              aria-label={totalItems > 0 ? `Keranjang belanja, ${totalItems} barang` : 'Keranjang belanja kosong'}
              aria-live="polite"
            >
              <ShoppingCartIcon className="h-8 w-8" aria-hidden="true" />
              {totalItems > 0 && (
                <span
                  className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-semibold text-white"
                  aria-hidden="true"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </Link>
            <ProfileDropdown />
          </div>
        </nav>
      </header>
      <main
        id="main-content"
        className="container mx-auto px-4 sm:px-6 lg:px-8 py-10"
        role="main"
        tabIndex={-1}
        style={{ maxWidth: '1200px', flexGrow: 1 }}
      >
        <Outlet />
      </main>
      <footer className="footer" role="contentinfo">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="text-lg font-semibold text-gray-800">Ztyle</h3>
            <address className="not-italic text-gray-600">
              Jalan Raya No. 123<br />
              Bandung, Jawa Barat 40123<br />
              Indonesia
            </address>
          </div>
          <div className="footer-section">
            <h3 className="text-lg font-semibold text-gray-800">Hubungi Kami</h3>
            <p>
              Email: <a href="mailto:iqbaljaffar1108@gmail.com" className="hover:text-blue-600 transition-colors">iqbaljaffar1108@gmail.com</a>
            </p>
            <p>
              Telepon: <a href="tel:+621234567890" className="hover:text-blue-600 transition-colors">+62 123 456 7890</a>
            </p>
          </div>
          <div className="footer-section">
            <h3 className="text-lg font-semibold text-gray-800">Ikuti Kami</h3>
            <div className="social-icons flex items-center">
              <a
                href="https://www.instagram.com/miqbaljaffar_/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="Kunjungi akun Instagram Ztyle (buka di tab baru)"
              >
                <FaInstagram size={24} className="social-icon-item" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/in/mohammad-iqbal-jaffar-091939290/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label="Kunjungi profil LinkedIn Ztyle (buka di tab baru)"
              >
                <FaLinkedin size={24} className="social-icon-item" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Ztyle. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </>
  );
}
