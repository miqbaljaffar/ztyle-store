import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const verifyEmail = useAuthStore((state) => state.verifyEmail);

  const tokenFromUrl = searchParams.get('token');

  useEffect(() => {
    if (tokenFromUrl) {
      setOtp(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const finalToken = otp.trim() || tokenFromUrl;
    if (!finalToken) {
      setError('Kode OTP diperlukan.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await verifyEmail(finalToken);
      toast.success(result.message || 'Verifikasi email berhasil! Silakan login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Verifikasi gagal.');
      toast.error(err.message || 'Verifikasi gagal.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[450px] mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-3">Verifikasi Email</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Kami telah mengirimkan kode OTP ke email Anda. Silakan masukkan kode tersebut di bawah ini untuk mengaktifkan akun Anda.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <p className="rounded-xl bg-red-50 border border-red-100 p-3 text-red-600 text-sm font-semibold">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="otp" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Kode OTP
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength={6}
              placeholder="••••••"
              className="w-full py-4 text-center rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-2xl font-black tracking-[0.6em] pl-[0.6em] placeholder:text-gray-200"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Memverifikasi...' : 'Verifikasi Akun'}
          </button>
        </form>
      </div>
    </div>
  );
}
