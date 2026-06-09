'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim email reset password.');
      }

      setSuccess(data.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h1>Lupa Password</h1>
      <p>Masukkan email Anda di bawah ini untuk menerima instruksi reset password.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        {error && <p style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}
        {success && <p style={{ color: 'green', marginBottom: '20px', textAlign: 'center' }}>{success}</p>}

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>

        <button type="submit" className="btn" disabled={isLoading} style={{ width: '100%' }}>
          {isLoading ? 'Mengirim...' : 'Kirim Instruksi'}
        </button>
      </form>
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <Link href="/login" style={{ color: '#0070f3' }}>Kembali ke Login</Link>
      </div>
    </div>
  );
}