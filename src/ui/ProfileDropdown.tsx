import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'; 

export default function ProfileDropdown() {
  const { user, isLoading, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownRef])

  const handleSignOut = async () => {
    toast.success('Anda telah berhasil logout.');
    await logout();
    setIsOpen(false);
    navigate('/');
  };

  if (isLoading) {
    return (
      <button className="profile-icon">
        <UserCircleIcon />
      </button>
    );
  }

  return (
    <div className="profile-dropdown-container" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="profile-icon">
        <UserCircleIcon />
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {!user ? (
            <Link to="/login" onClick={() => setIsOpen(false)}>
              Login
            </Link>
          ) : (
            <>
              {user.role === 'ADMIN' ? (
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)}>
                    Akun
                  </Link>
                  <Link to="/profile/orders" onClick={() => setIsOpen(false)}>
                    Riwayat Pesanan
                  </Link>
                </>
              )}
              <a onClick={handleSignOut} style={{ cursor: 'pointer' }}>
                Logout
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}