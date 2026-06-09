import Link from 'next/link';
import { MagnifyingGlassIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function ProductNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-5 text-center">
      
      {/* Ikon yang Relevan */}
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-500">
        <MagnifyingGlassIcon className="h-12 w-12" />
      </div>
      
      <h1 className="mt-8 text-3xl font-bold text-gray-800 md:text-4xl">
        Produk Tidak Ditemukan
      </h1>
      
      <p className="mt-4 max-w-md text-base text-gray-600 md:text-lg">
        Maaf, kami tidak bisa menemukan produk yang Anda cari. 
        Mungkin produk tersebut sudah tidak tersedia atau ID-nya salah.
      </p>
      
      {/* Opsi untuk Pengguna */}
      <div className="mt-10 w-full max-w-sm space-y-4">
        {/* Opsi 1: Kembali ke Daftar Produk */}
        <Link href="/products" className="btn flex w-full items-center justify-center gap-2">
          <ShoppingBagIcon className="h-5 w-5" />
          <span>Lihat Semua Produk</span>
        </Link>
        
        {/* Opsi 2: Kembali ke Beranda */}
        <p className="text-sm text-gray-500">
          Atau <Link href="/" className="font-semibold text-blue-600 hover:underline">kembali ke Beranda</Link>.
        </p>
      </div>

    </div>
  );
}