'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyEmailForm() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const finalToken = otp || tokenFromUrl;
      if (!finalToken) {
        throw new Error("Kode OTP diperlukan.");
      }

      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: finalToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Verifikasi gagal.');
      }

      alert('Verifikasi berhasil! Silakan login.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h1>Verifikasi Email</h1>
      <p>Kami telah mengirimkan kode OTP ke email Anda. Silakan masukkan di bawah ini.</p>

      <form onSubmit={handleSubmit} style={{ marginTop: '30px' }}>
        {error && <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>}

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="otp" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Kode OTP</label>
          <input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }}
          />
        </div>

        <button type="submit" className="btn" disabled={isLoading} style={{ width: '100%' }}>
          {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
        </button>
      </form>
    </div>
  );
}


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  )
}