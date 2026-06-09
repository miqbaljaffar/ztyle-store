import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { revalidatePath } from 'next/cache';
import prisma from '@/lib/prisma';
import AddToCartButton from '@/app/ui/products/AddToCartButton';
import BuyNowButton from '@/app/ui/products/BuyNowButton';
import StarRating from '@/app/ui/products/StarRating';
import ReviewForm from '@/app/ui/products/ReviewForm';
import RelatedProducts from '@/app/ui/products/RelatedProducts';

// --- Tipe Data (tidak berubah) ---
interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
  };
}

// --- DATA FETCHING (diperbarui) ---
const getProductData = unstable_cache(
  async (id: number) => {
    // Ambil data produk utama dan produk terkait secara bersamaan
    const [product, relatedProducts] = await Promise.all([
      prisma.product.findUnique({
        where: { id },
        include: {
          category: true,
          reviews: {
            include: { user: { select: { name: true, image: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.product.findMany({
        where: {
          // Logika ini dipindahkan ke sini dari komponen client
          categoryId: (await prisma.product.findUnique({ where: { id } }))?.categoryId,
          id: { not: id },
        },
        take: 8,
      })
    ]);

    if (!product) {
      notFound();
    }

    // Konversi price dari Decimal ke number agar type-safe di frontend dan tidak merusak toLocaleString()
    const productWithNumberPrice = {
      ...product,
      price: Number(product.price)
    };

    const relatedProductsWithNumberPrice = relatedProducts.map(p => ({
      ...p,
      price: Number(p.price)
    }));

    const totalReviews = product.reviews.length;
    
    const averageRating =
      totalReviews > 0
        ? product.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / totalReviews
        : 0;

    return { 
      product: productWithNumberPrice, 
      relatedProducts: relatedProductsWithNumberPrice, 
      totalReviews, 
      averageRating: parseFloat(averageRating.toFixed(1)) 
    };
  },
  ['product_with_related_reviews'], // Kunci cache diubah untuk mencerminkan data baru
  { revalidate: 3600 }
);


// --- METADATA GENERATION (tidak berubah) ---
type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) return {};

  // Memanggil data tanpa produk terkait untuk metadata agar lebih cepat
  const { product, averageRating, totalReviews } = await getProductData(productId);

  const title = `Jual ${product.name} - Ztyle Store`;
  const description =
    product.description?.substring(0, 160) ||
    `Beli ${product.name} terbaik. Rating ${averageRating}/5 dari ${totalReviews} ulasan. Bahan premium, pengiriman cepat.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: product.imageUrl, width: 800, height: 600, alt: `Gambar ${product.name}` }],
    },
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  };
}


// --- MAIN COMPONENT ---
export default async function ProductDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const searchParamsObject = await searchParams;

  const productId = parseInt(id, 10);
  const orderItemIdStr = searchParamsObject.order_item_id as string | undefined;
  const orderItemId = orderItemIdStr ? parseInt(orderItemIdStr) : null;

  if (isNaN(productId)) {
    notFound();
  }

  // Mengambil semua data yang diperlukan
  const { product, relatedProducts, totalReviews, averageRating } = await getProductData(productId);
  const session = await getServerSession(authOptions);
  const userRole = session?.user?.role;
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  let canReview = false;
  if (session?.user?.id && orderItemId) {
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        productId: productId,
        order: { userId: session.user.id, status: { in: ['PAID', 'DELIVERED'] } },
        reviewId: null,
      },
    });
    if (orderItem) {
      canReview = true;
    }
  }

  const productSchema = { /* ... */ };
  const breadcrumbSchema = { /* ... */ };

  const handleReviewSubmitted = async () => {
    'use server'
    revalidatePath(`/products/${productId}`);
  };

  return (
    <div>
      {/* ... (Script dan Link Kembali) ... */}
      <Link href="/products" className="inline-block mb-5 text-gray-800 hover:text-blue-600 transition-colors">
        ← Kembali ke Semua Produk
      </Link>

      <div className="card">
        {/* ... (Konten Detail Produk Utama) ... */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
              <Image src={product.imageUrl} alt={`Gambar produk ${product.name}`} fill className="object-cover" />
            </div>
            <span className="inline-block bg-gray-200 text-gray-700 text-sm font-medium px-4 py-1 rounded-full mt-6">
              {product.category.name}
            </span>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{product.name}</h1>
            <div className="mb-4">
              <StarRating rating={averageRating} count={totalReviews} />
            </div>
            <div 
              className="text-lg text-gray-600 mb-6 prose"
              dangerouslySetInnerHTML={{ __html: product.description || '' }}
            />

            <div className="text-4xl font-bold text-gray-900 mb-8">
              Rp{product.price.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center gap-4">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: product.imageUrl,
                }}
                className="btn flex-1"
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
                className="btn flex-1 bg-gray-800 hover:bg-gray-700"
                disabled={product.stock === 0}
                userRole={userRole} 
              >
                {product.stock === 0 ? 'Stok Habis' : 'Beli Sekarang'}
              </BuyNowButton>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* ... (Fitur dan Spesifikasi) ... */}
      </div>

      {/* Melewatkan data produk terkait ke komponen client */}
      <RelatedProducts products={relatedProducts} />

      {canReview && orderItemId && (
        <ReviewForm
          productId={productId}
          orderItemId={orderItemId}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}

      <div className="card mt-8">
        {/* ... (Konten Ulasan Pelanggan) ... */}
         <h2 className="text-2xl font-bold mb-6">Ulasan Pelanggan ({totalReviews})</h2>
        <div className="space-y-6">
          {totalReviews > 0 ? (
            product.reviews.map((review: Review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center mb-2">
                  <p className="font-semibold text-lg mr-4">{review.user.name}</p>
                  <StarRating rating={review.rating} />
                </div>
                <p className="text-gray-700">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))
          ) : (
            <p>Belum ada ulasan untuk produk ini. Jadilah yang pertama memberi ulasan!</p>
          )}
        </div>
      </div>
    </div>
  );
}