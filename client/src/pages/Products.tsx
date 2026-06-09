import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductList from '../ui/products/ProductList';
import Pagination from '../ui/pagination';
import Search from '../ui/search';
import SortDropdown from '../ui/products/SortDropdown';
import { useAuthStore } from '../store/authStore';

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

export default function Products() {
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const userRole = user?.role || null;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const queryStr = searchParams.toString();
        // Fetch products with the current filters and paging
        const [productsRes, categoriesRes] = await Promise.all([
          fetch(`/api/products?${queryStr}`),
          fetch('/api/categories?page=1'), // Category list for sidebar filters
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData.products);
          setTotalPages(productsData.totalPages);
          setCurrentPage(productsData.currentPage);
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData.categories);
        }
      } catch (error) {
        console.error('Gagal mengambil data produk:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  return (
    <div className="space-y-8" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="card text-center bg-gray-50 py-10" style={{ backgroundColor: '#f9fafb', padding: '40px 20px', borderRadius: '12px', textAlign: 'center' }}>
        <h1 className="text-4xl font-bold" style={{ fontSize: '2.25rem', fontWeight: 700 }}>Koleksi Pilihan Kami</h1>
        <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto" style={{ fontSize: '1.125rem', color: '#4b5563', marginTop: '8px', maxWidth: '42rem', margin: '8px auto 0 auto' }}>
            Jelajahi koleksi pakaian berkualitas tinggi dari kami, siap untuk Anda miliki.
        </p>
      </div>
      
      <div className="px-4 md:px-0">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
              <div className="flex-grow" style={{ flexGrow: 1 }}>
                <Search placeholder="Cari produk..." />
              </div>
              <div className="w-full md:w-auto md:min-w-[200px]" style={{ minWidth: '200px' }}>
                <SortDropdown /> 
              </div>
          </div>

          {isLoading ? (
            <div className="text-center py-20">Memuat produk...</div>
          ) : (
            <>
              <ProductList products={products} categories={categories} userRole={userRole} />
              <Pagination currentPage={currentPage} totalPages={totalPages} />
            </>
          )}
      </div>
    </div>
  );
}
