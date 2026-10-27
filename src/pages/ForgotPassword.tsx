import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function ForgotPassword() {
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

      setSuccess(data.message || 'Instruksi reset password berhasil dikirim.');
      toast.success('Email instruksi reset password berhasil dikirim.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
      toast.error(err.message || 'Gagal memproses permintaan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[450px] mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Lupa Password</h1>
          <p className="text-sm text-gray-500 mt-2">
            Masukkan email Anda di bawah ini untuk menerima instruksi reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 p-3.5 text-center text-red-600 text-sm font-semibold">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-green-50 border border-green-100 p-3.5 text-center text-green-700 text-sm font-semibold">
              {success}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              placeholder="Masukkan alamat email terdaftar"
              className="block w-full rounded-md border border-gray-200 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Mengirim...' : 'Kirim Instruksi'}
          </button>
        </form>
        
        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-blue-600 font-bold hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}
