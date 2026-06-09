'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Skema validasi yang sama dengan di API route untuk konsistensi
const RegisterSchema = z.object({
  name: z.string().min(3, "Nama harus lebih dari 3 karakter."),
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(6, "Password minimal harus 6 karakter."),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal harus 6 karakter."),
}).refine(data => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak cocok.",
  path: ["confirmPassword"], 
});


// Mengekstrak tipe data dari skema Zod
type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function RegisterPage() {
  // State untuk menangani error yang mungkin dikirim dari server/API
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();

  // Inisialisasi React Hook Form dengan Zod sebagai resolver
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  // Fungsi yang dijalankan saat form valid dan di-submit
  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null); // Reset error setiap kali submit
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        // Jika API mengembalikan error, tampilkan pesannya
        throw new Error(responseData.message || 'Gagal melakukan registrasi.');
      }

      // Jika sukses, arahkan ke halaman verifikasi email
      router.push('/verify-email');
      
    } catch (err: any) {
      // Tangkap dan tampilkan error
      setApiError(err.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px', margin: '40px auto' }}>
      <h1>Buat Akun Baru</h1>
      <p>Sudah punya akun? <Link href="/login" style={{ color: '#0070f3' }}>Masuk di sini</Link></p>

      {/* Form registrasi manual */}
      <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '30px' }}>
        {apiError && <p style={{ color: 'red', marginBottom: '20px', textAlign: 'center' }}>{apiError}</p>}
        
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Nama Lengkap</label>
          <input
            {...register('name')}
            id="name"
            type="text"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {/* Menampilkan pesan error spesifik dari Zod */}
          {errors.name && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.name.message}</p>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Email</label>
          <input
            {...register('email')}
            id="email"
            type="email"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.email.message}</p>}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Password</label>
          <input
            {...register('password')}
            id="password"
            type="password"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {errors.password && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.password.message}</p>}
        </div>

        {/* --- INPUT KONFIRMASI PASSWORD --- */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>Konfirmasi Password</label>
          <input
            {...register('confirmPassword')}
            id="confirmPassword"
            type="password"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
          {errors.confirmPassword && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" className="btn" disabled={isSubmitting} style={{ width: '100%' }}>
          {isSubmitting ? 'Mendaftarkan...' : 'Daftar'}
        </button>
      </form>
      
      {/* Pemisah */}
      <div style={{ textAlign: 'center', margin: '25px 0', color: '#888', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <hr style={{flex: 1, borderColor: '#eee'}} />
        <span>Atau</span>
        <hr style={{flex: 1, borderColor: '#eee'}} />
      </div>

      {/* Tombol Daftar dengan Google */}
      <button
        onClick={() => signIn('google', { callbackUrl: '/' })}
        className="btn"
        style={{ 
          width: '100%', 
          background: '#4285F4',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
        Daftar dengan Google
      </button>
    </div>
  );
}