import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import AddToCartButton from '../ui/products/AddToCartButton';
import BuyNowButton from '../ui/products/BuyNowButton';
import StarRating from '../ui/products/StarRating';
import ReviewForm from '../ui/products/ReviewForm';
import RelatedProducts from '../ui/products/RelatedProducts';

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  description: string | null;
  categoryId: number;
  category: {
    id: number;
    name: string;
  };
  features: string[];
  specifications: Record<string, any>;
  reviews: Review[];
  relatedProducts: {
    id: number;
    name: string;
    price: number;
    imageUrl: string;
    stock: number;
  }[];
  totalReviews: number;
  averageRating: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const userRole = user?.role;

  const orderItemIdStr = searchParams.get('order_item_id');
  const orderItemId = orderItemIdStr ? parseInt(orderItemIdStr, 10) : null;
  const productId = id ? parseInt(id, 10) : NaN;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canReview, setCanReview] = useState(false);

  const fetchProduct = async () => {
    if (isNaN(productId)) {
      setError('ID Produk tidak valid.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/products/${productId}`);
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Produk tidak ditemukan.' : 'Gagal mengambil data produk.');
      }
      const data = await res.json();
      setProduct(data);

      // Check review eligibility if user is authenticated and orderItemId is provided
      if (user && orderItemId) {
        const checkRes = await fetch(`/api/reviews/check?productId=${productId}&orderItemId=${orderItemId}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setCanReview(checkData.canReview);
        }
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [productId, user, orderItemId]);

  const handleReviewSubmitted = async () => {
    await fetchProduct();
    setCanReview(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Produk tidak ditemukan'}</h2>
        <Link to="/products" className="btn btn-primary">
          Kembali ke Semua Produk
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link to="/products" className="inline-block mb-6 text-gray-600 hover:text-blue-600 transition-colors">
        ← Kembali ke Semua Produk
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div className="space-y-4">
            <div className="relative w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <span className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full">
              {product.category.name}
            </span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 leading-tight">{product.name}</h1>
            <div className="mb-4">
              <StarRating rating={product.averageRating} count={product.totalReviews} />
            </div>
            
            <div className="text-3xl font-black text-blue-600 mb-6">
              Rp{product.price.toLocaleString('id-ID')}
            </div>

            <div 
              className="text-gray-600 mb-8 leading-relaxed prose max-w-none text-sm md:text-base"
              dangerouslySetInnerHTML={{ __html: product.description || '' }}
            />

            <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center gap-4">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.imageUrl,
                }}
                className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold transition-all text-center ${
                  product.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100'
                }`}
                disabled={product.stock === 0}
                userRole={userRole} 
              >
                {product.stock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </AddToCartButton>
              
              <BuyNowButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.imageUrl,
                }}
                className={`w-full sm:flex-1 py-3 px-6 rounded-xl font-bold transition-all text-center ${
                  product.stock === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-950 hover:bg-gray-800 text-white shadow-lg shadow-gray-200'
                }`}
                disabled={product.stock === 0}
                userRole={userRole} 
              >
                {product.stock === 0 ? 'Stok Habis' : 'Beli Sekarang'}
              </BuyNowButton>
            </div>
          </div>
        </div>
      </div>

      {/* Features & Specifications */}
      {((product.features && product.features.length > 0) || (product.specifications && Object.keys(product.specifications).length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {product.features && product.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Fitur Utama</h2>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                {product.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Spesifikasi</h2>
              <div className="divide-y divide-gray-100">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div key={key} className="py-2 flex justify-between text-sm">
                    <span className="font-medium text-gray-500">{key}</span>
                    <span className="text-gray-900 font-semibold">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Related Products */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="mb-8">
          <RelatedProducts products={product.relatedProducts} />
        </div>
      )}

      {/* Review Form */}
      {canReview && orderItemId && (
        <div className="mb-8">
          <ReviewForm
            productId={productId}
            orderItemId={orderItemId}
            onReviewSubmitted={handleReviewSubmitted}
          />
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Ulasan Pelanggan ({product.totalReviews})</h2>
        <div className="space-y-6">
          {product.totalReviews > 0 ? (
            product.reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900 text-base">{review.user.name || 'Anonymous'}</p>
                    <div className="mt-1">
                      <StarRating rating={review.rating} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mt-2">{review.comment || 'Tidak ada ulasan tertulis.'}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-6">Belum ada ulasan untuk produk ini. Jadilah yang pertama memberikan ulasan!</p>
          )}
        </div>
      </div>
    </div>
  );
}
