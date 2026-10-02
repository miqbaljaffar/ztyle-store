import { Link } from 'react-router-dom';
import Filter from './filter';
import AddToCartButton from './AddToCartButton';
import StarRating from './StarRating';
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
      <aside aria-label="Filter produk">
        <Filter categories={categories} />
      </aside>

      <div>
        {products.length === 0 ? (
          <div className="card text-center" role="status">
            <p>Tidak ada produk yang sesuai dengan kriteria filter Anda.</p>
          </div>
        ) : (
          <ul
            className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 xl:grid-cols-3"
            role="list"
            aria-label="Daftar produk"
          >
            {products.map((product) => (
              <li key={product.id}>
                <article className="product-card group flex h-full flex-col" aria-labelledby={`product-${product.id}-name`}>
                  <Link
                    to={`/products/${product.id}`}
                    className="block"
                    aria-label={`Lihat detail produk ${product.name}`}
                  >
                    <div className="relative h-64 w-full cursor-pointer overflow-hidden rounded-t-lg bg-gray-100">
                      <img
                        src={product.imageUrl}
                        alt={`Produk ${product.name}`}
                        width={500}
                        height={500}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/products/default.jpg';
                        }}
                      />
                      {product.stock === 0 && (
                        <div
                          className="absolute right-2 top-2 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white"
                          role="badge"
                          aria-label="Stok habis"
                        >
                          STOK HABIS
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="product-info flex flex-grow flex-col p-4">
                    <span className="mb-2 inline-block self-start rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                      {product.category.name}
                    </span>
                    <h3
                      id={`product-${product.id}-name`}
                      className="truncate text-base font-semibold text-gray-800 transition-colors duration-200 group-hover:text-blue-600"
                    >
                      <Link to={`/products/${product.id}`} className="hover:underline">
                        {product.name}
                      </Link>
                    </h3>

                    <div className="my-2 flex items-center justify-between text-sm text-gray-500">
                      <StarRating rating={product.averageRating} />
                      <div className="flex items-center gap-1" aria-label={`${product.salesCount} terjual`}>
                        <ShoppingBagIcon className="h-4 w-4" aria-hidden="true" />
                        <span>{product.salesCount} terjual</span>
                      </div>
                    </div>

                    <p className="price mb-4 mt-auto text-xl font-bold text-gray-900" aria-label={`Harga: Rp ${product.price.toLocaleString('id-ID')}`}>
                      Rp{product.price.toLocaleString('id-ID')}
                    </p>
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
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}