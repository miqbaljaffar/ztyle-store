'use client'

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface RelatedProductsProps {
  products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
  const [page, setPage] = useState(0);
  const itemsPerPage = 4; 

  // Jika tidak ada produk, jangan tampilkan komponen ini
  if (!products || products.length === 0) {
    return null;
  }

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const showNavigation = products.length > itemsPerPage;

  const goToPreviousPage = () => {
    setPage((prevPage) => (prevPage === 0 ? totalPages - 1 : prevPage - 1));
  };

  const goToNextPage = () => {
    setPage((prevPage) => (prevPage === totalPages - 1 ? 0 : prevPage + 1));
  };

  const startIndex = page * itemsPerPage;
  const visibleProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="card mt-8">
      <h2 className="text-2xl font-bold mb-6">Produk Terkait</h2>
      <div className="relative w-full flex items-center">
        {showNavigation && (
          <button
            onClick={goToPreviousPage}
            className="absolute left-0 z-10 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-in-out transform active:scale-90 -translate-x-1/2"
            aria-label="Previous Products"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-800" />
          </button>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {visibleProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`} className="group block">
              <div className="border rounded-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
                <div className="relative h-48 w-full">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
                  <p className="text-md font-bold text-gray-900 mt-1">Rp{product.price.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {showNavigation && (
           <button
            onClick={goToNextPage}
            className="absolute right-0 z-10 p-2 bg-white/80 rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-in-out transform active:scale-90 translate-x-1/2"
            aria-label="Next Products"
          >
            <ChevronRightIcon className="h-5 w-5 text-gray-800" />
          </button>
        )}
      </div>
    </div>
  );
};