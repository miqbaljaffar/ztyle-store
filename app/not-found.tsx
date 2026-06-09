import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg text-center">
        
        {/* Ilustrasi atau Gambar */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/404-illustragtion.svg" 
            alt="Halaman tidak ditemukan"
            width={300}
            height={300}
            className="drop-shadow-lg"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 md:text-5xl">
          Oops! Sepertinya Anda Tersesat.
        </h1>
        
        <p className="mt-4 text-base text-gray-600 md:text-lg">
          Halaman yang Anda tuju tidak dapat kami temukan. Mungkin URL-nya salah atau halamannya sudah dipindahkan.
        </p>
        
        {/* Tombol Aksi */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/" className="btn w-full sm:w-auto">
            Kembali ke Beranda
          </Link>
          
          <Link 
            href="/products" 
            className="btn w-full border-2 border-blue-500 bg-transparent text-blue-500 hover:bg-blue-50 sm:w-auto"
          >
            Lihat Semua Produk
          </Link>
        </div>
      </div>
    </div>
  );
}