'use client';

import { AtSymbolIcon, KeyIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner'; 

// Skema validasi dengan Zod
const LoginSchema = z.object({
  email: z.string().email({ message: 'Alamat email tidak valid.' }),
  password: z.string().min(6, { message: 'Password minimal harus 6 karakter.' }),
});

// Tipe data dari skema
type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
  });

  // Fungsi onSubmit yang akan dipanggil oleh handleSubmit
  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setLoginError('Email atau password yang Anda masukkan salah.');
        } else {
          setLoginError(result.error);
        }
        return;
      }
      
      // 2. Tampilkan notifikasi sukses
      toast.success('Login berhasil! Selamat datang kembali.');

      const res = await fetch('/api/user/profile');
      const user = await res.json();

      if (user && user.role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }

      router.refresh();

    } catch (e) {
      console.error(e);
      setLoginError('Terjadi kesalahan yang tidak terduga.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="w-full">
        <div>
          <label
            className="mb-2 block text-sm font-medium text-gray-900"
            htmlFor="email"
          >
            Email
          </label>
          <div className="relative">
            <input
              {...register('email')}
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="email"
              type="email"
              placeholder="Masukkan alamat email Anda"
              disabled={isSubmitting}
            />
            <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>
        <div className="mt-4">
          <label
            className="mb-2 block text-sm font-medium text-gray-900"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
              id="password"
              type="password"
              placeholder="Masukkan password"
              disabled={isSubmitting}
            />
            <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>
      </div>
      
      {loginError && (
        <div className="mt-4 text-center">
          <p className="text-sm text-red-500">{loginError}</p>
        </div>
      )}
      
      <button type="submit" className="btn w-full justify-center" disabled={isSubmitting} aria-disabled={isSubmitting}>
        {isSubmitting ? 'Memproses...' : 'Log in'} <ArrowRightIcon className="ml-auto h-5 w-5" />
      </button>
    </form>
  );
}