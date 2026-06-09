import LoginForm from '../ui/login-form';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="max-w-[450px] mx-auto my-12 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Masuk</h1>
          <p className="text-sm text-gray-500 mt-2">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-600 font-bold hover:underline">
              Daftar di sini
            </Link>
          </p>
        </div>

        <LoginForm />

        <div className="text-right mt-4">
          <Link to="/forgot-password" className="text-xs text-blue-600 font-semibold hover:underline">
            Lupa Password?
          </Link>
        </div>
      </div>
    </div>
  );
}
