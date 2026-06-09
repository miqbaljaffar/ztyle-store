'use client'

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserCircleIcon, PencilIcon, ShieldCheckIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

// Skema validasi yang sama dari API
const profileSchema = z.object({
  name: z.string().min(3, "Nama harus memiliki setidaknya 3 karakter.").max(50),
  phoneNumber: z.string().max(15).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      address: '',
    }
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    if (session?.user) {
      reset({
        name: session.user.name ?? '',
        phoneNumber: session.user.phoneNumber ?? '',
        address: session.user.address ?? '',
      });
    }
  }, [session, reset, status, router]);

  const onSubmit = async (data: ProfileFormValues) => {
    setApiError(null);
    const promise = async () => {
        const res = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Gagal memperbarui profil.');
        }

        await update({
            ...session,
            user: {
                ...session?.user,
                name: data.name,
                address: data.address,
                phoneNumber: data.phoneNumber,
            }
        });

        return { ...data };
    };

    toast.promise(promise(), {
        loading: 'Menyimpan perubahan...',
        success: (updatedData) => {
            reset(updatedData); // Reset form state dengan data baru agar 'isDirty' kembali false
            return 'Profil berhasil diperbarui!';
        },
        error: (err) => {
            setApiError(err.message);
            return err.message;
        }
    });
  };

  if (status === "loading") {
    return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );
  }
  
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Pengaturan Akun</h1>
        <p className="text-gray-500 mt-1">Kelola informasi profil dan preferensi Anda.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="md:grid md:grid-cols-3">
          {/* Kolom Kiri - Info Pengguna */}
          <div className="md:col-span-1 p-8 bg-gray-50 border-r border-gray-200">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-4xl font-bold text-blue-600">
                          {session?.user?.name?.charAt(0).toUpperCase()}
                      </span>
                  </div>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">{session?.user?.name}</h2>
              <p className="text-gray-500 text-sm">{session?.user?.email}</p>
              <span className="mt-2 text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <ShieldCheckIcon className="w-4 h-4" />
                Verified Account
              </span>
            </div>
          </div>

          {/* Kolom Kanan - Form Edit */}
          <div className="md:col-span-2 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {apiError && <p className="rounded-md bg-red-100 p-3 text-center text-red-600 text-sm">{apiError}</p>}
              
              {/* Input Nama */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <UserCircleIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      {...register('name')}
                      id="name"
                      type="text"
                      disabled={isSubmitting}
                      className="input-field pl-10"
                    />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
              </div>
              
              {/* Input Telepon */}
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <PhoneIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      {...register('phoneNumber')}
                      id="phoneNumber"
                      type="tel"
                      disabled={isSubmitting}
                      placeholder="e.g., 081234567890"
                      className="input-field pl-10"
                    />
                </div>
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-500">{errors.phoneNumber.message}</p>}
              </div>

              {/* Input Alamat */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                 <div className="relative">
                     <span className="pointer-events-none absolute top-0 left-0 flex items-center pl-3 pt-3">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                    </span>
                    <textarea
                      {...register('address')}
                      id="address"
                      rows={4}
                      disabled={isSubmitting}
                      placeholder="Masukkan alamat lengkap Anda"
                      className="input-field pl-10 pt-2"
                    />
                </div>
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address.message}</p>}
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                  <button 
                      type="button" 
                      onClick={() => reset()} 
                      className="btn bg-gray-200 text-gray-800 hover:bg-gray-300"
                      disabled={!isDirty || isSubmitting}
                  >
                      Batal
                  </button>
                  <button 
                      type="submit" 
                      className="btn" 
                      disabled={!isDirty || isSubmitting}
                  >
                      {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <style jsx>{`
        .input-field {
          display: block;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid #D1D5DB;
          background-color: #F9FAFB;
          padding: 0.75rem;
          font-size: 0.875rem;
          color: #111827;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          outline: none;
          border-color: #3B82F6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4);
        }
        .input-field.pl-10 {
            padding-left: 2.5rem;
        }
        .input-field.pt-2 {
            padding-top: 0.5rem;
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}