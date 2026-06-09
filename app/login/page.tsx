'use client'; 

import LoginForm from '@/app/ui/login-form';
import Link from 'next/link';
import { signIn } from 'next-auth/react'; 

export default function LoginPage() {
  return (
    <div style={{ maxWidth: '500px', margin: '40px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '700' }}>Login</h1>
          <p style={{ color: '#555', marginTop: '10px' }}>
            Belum punya akun?{' '}
            <Link href="/register" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: '600' }}>
              Daftar di sini
            </Link>
          </p>
        </div>
        <LoginForm />

        <div style={{ textAlign: 'right', marginTop: '15px' }}>
          <Link href="/forgot-password" style={{ color: '#0070f3', fontSize: '14px', textDecoration: 'none' }}>
            Lupa Password?
          </Link>
        </div>
        
        <div style={{ textAlign: 'center', margin: '25px 0', color: '#888', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <hr style={{flex: 1, borderColor: '#eee'}} />
          <span>Atau</span>
          <hr style={{flex: 1, borderColor: '#eee'}} />
        </div>
        
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="btn"
          style={{ 
            width: '100%', 
            background: '#4285F4', // Warna Google yang lebih modern
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            <path d="M1 1h22v22H1z" fill="none"/>
          </svg>
          Login dengan Google
        </button>
      </div>
    </div>
  );
}