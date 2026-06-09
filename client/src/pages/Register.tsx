import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';
import { UserIcon, AtSymbolIcon, KeyIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';

const RegisterSchema = z.object({
  name: z.string().min(3, 'Nama harus memiliki setidaknya 3 karakter.'),
  email: z.string().email('Format email tidak valid.'),
  password: z.string().min(6, 'Password minimal harus 6 karakter.'),
  confirmPassword: z.string().min(6, 'Konfirmasi password minimal harus 6 karakter.'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Password dan konfirmasi password tidak cocok.',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

export default function Register() {
  const [apiError, setApiError] = useState<string | null>(null);
  const registerUser = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setApiError(null);
    try {
      const result = await registerUser(data.name, data.email, data.password);
      toast.success(result.message || 'Registrasi berhasil! Silakan cek email Anda.');
      navigate('/verify-email');
    } catch (err: any) {
      setApiError(err.message || 'Terjadi kesalahan saat registrasi.');
      toast.error(err.message || 'Gagal mendaftar.');
    }
  };

  return (
    <div className="max-w-[450px] mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Daftar Akun</h1>
          <p className="text-sm text-gray-500 mt-2">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {apiError && (
            <p className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-center text-red-600 text-sm font-semibold">
              {apiError}
            </p>
          )}

          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-900">
              Nama Lengkap
            </label>
            <div className="relative">
              <input
                {...register('name')}
                id="name"
                type="text"
                placeholder="Masukkan nama lengkap Anda"
                disabled={isSubmitting}
                className="peer block w-full rounded-md border border-gray-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-gray-900" />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
              Email
            </label>
            <div className="relative">
              <input
                {...register('email')}
                id="email"
                type="email"
                placeholder="Masukkan alamat email Anda"
                disabled={isSubmitting}
                className="peer block w-full rounded-md border border-gray-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <AtSymbolIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-gray-900" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password')}
                id="password"
                type="password"
                placeholder="Buat password minimal 6 karakter"
                disabled={isSubmitting}
                className="peer block w-full rounded-md border border-gray-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-gray-900" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-900">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                placeholder="Masukkan kembali password"
                disabled={isSubmitting}
                className="peer block w-full rounded-md border border-gray-200 py-2.5 pl-10 text-sm outline-2 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <KeyIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 peer-focus:text-gray-900" />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Mendaftarkan...' : 'Daftar Akun'}
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
