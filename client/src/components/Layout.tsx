import { Link, Outlet } from 'react-router-dom';
import ProfileDropdown from '../ui/ProfileDropdown'; 
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { FaInstagram, FaLinkedin } from 'react-icons/fa';
import { useCartStore } from '../store/cart';

export default function Layout() {
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <header className="header">
        <nav className="nav">
          <Link to="/" className="logo">
            <img src="/Logo.png" alt="Ztyle Logo" style={{ width: '120px', height: '45px', objectFit: 'contain' }} />
          </Link>
          <div className="nav-right-section">
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/news">News</Link></li>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
            <Link to="/checkout" className="profile-icon relative">
              <ShoppingCartIcon className="h-8 w-8" style={{ width: '32px', height: '32px' }} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white" style={{ position: 'absolute', top: '-4px', right: '-8px', display: 'flex', height: '20px', width: '20px', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: '#dc2626', fontSize: '12px', color: '#ffffff' }}>
                  {totalItems}
                </span>
              )}
            </Link>
            <ProfileDropdown />
          </div>
        </nav>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', flexGrow: 1 }}>
        <Outlet />
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
