'use client';

import Link from 'next/link';
import Image from 'next/image';
import Filter from '@/app/ui/products/filter';
import AddToCartButton from '@/app/ui/products/AddToCartButton';
import StarRating from '@/app/ui/products/StarRating';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

interface Product {
  id: number;
  name: string;
  price: number;
  category: { name: string };
  imageUrl: string;
  stock: number;
  averageRating: number;
  salesCount: number;
}

interface Category {
  id: number;
  name: string;
}

interface ProductListProps {
  products: Product[];
  categories: Category[];
  userRole?: string | null;
}

export default function ProductList({ products, categories, userRole }: ProductListProps) {

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
      <aside>
        <Filter categories={categories} />
      </aside>

      <div>
        {products.length === 0 ? (
          <div className="card text-center">
            <p>Tidak ada produk yang sesuai dengan kriteria filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <div key={product.id} className="product-card group flex flex-col">
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative h-64 w-full cursor-pointer overflow-hidden rounded-t-lg">
                    <Image
                      src={product.imageUrl}
                      alt={`Gambar produk ${product.name}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => (e.currentTarget.src = '/products/default.jpg')}
                    />
                    {product.stock === 0 && (
                      <div className="absolute top-2 right-2 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
                        STOK HABIS
                      </div>
                    )}
                  </div>
                </Link>
                <div className="product-info flex flex-grow flex-col p-4">
                  <span className="mb-2 inline-block self-start rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                    {product.category.name}
                  </span>
                  <h3 className="truncate text-base font-semibold text-gray-800 transition-colors duration-200 group-hover:text-blue-600">
                    {product.name}
                  </h3>
                  
                  <div className="my-2 flex items-center justify-between text-sm text-gray-500">
                    <StarRating rating={product.averageRating} />
                    <div className="flex items-center gap-1">
                      <ShoppingBagIcon className="h-4 w-4" />
                      <span>{product.salesCount} terjual</span>
                    </div>
                  </div>

                  <div className="price mt-auto mb-4 text-xl font-bold text-gray-900">
                    Rp{product.price.toLocaleString('id-ID')}
                  </div>
                  <div className="mt-auto">
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        imageUrl: product.imageUrl,
                      }}
                      className="btn w-full"
                      disabled={product.stock === 0}
                      userRole={userRole} 
                    >
                      {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                    </AddToCartButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}