import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache'; 
import ProductCarousel from '@/app/ui/ProductCarousel';
import ScrollReveal from '@/app/ui/animations/ScrollReveal';

// Definisikan tipe data
interface Product {
  id: number;
  name: string;
  imageUrl: string;
}

interface News {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  slug: string;
}

// Fungsi untuk mengambil produk secara acak (tetap sama)
const getCachedFeaturedData = unstable_cache(
  async () => {
    const productsToTake = 9;
    const totalProducts = await prisma.product.count();
    const skip = totalProducts > productsToTake 
      ? Math.floor(Math.random() * (totalProducts - productsToTake)) 
      : 0;

    const products = await prisma.product.findMany({
      take: productsToTake,
      skip: skip,
      orderBy: { id: 'asc' },
      select: { id: true, name: true, imageUrl: true }
    });

    const news = await prisma.news.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return { products, news };
  },
  ['featured_data_random_carousel_v2'],
  { revalidate: 3600 }
);


export default async function Home() {
  const { products, news } = await getCachedFeaturedData();

  return (
    <div className="space-y-20">
      <ScrollReveal direction="none" duration={0.8}>
        <section 
          className="relative text-center py-24 md:py-32 rounded-lg overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: 'url(/back.jpg)' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/30 z-10"></div>
          <div className="relative z-20 px-4">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white shadow-lg">
              Your Style, Your Story, Your Ztyle.
            </h1>
            <p className="text-lg text-gray-200 max-w-3xl mx-auto mb-8">
              Temukan koleksi fashion terkurasi yang mewakili dirimu. Dibuat dengan bahan premium dan desain yang tak lekang oleh waktu.
            </p>
            <Link href="/products" className="btn bg-white text-gray-900 hover:bg-gray-200 shadow-md transform hover:scale-105 transition-transform duration-300">
              Jelajahi Koleksi Terbaru
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <section>
        <ScrollReveal>
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800">Produk Unggulan Pilihan Kami</h2>
              <p className="text-md text-gray-500 mt-2">Setiap item dipilih untuk melengkapi gayamu.</p>
          </div>
        </ScrollReveal>
        <div className="mx-auto max-w-6xl px-10">
           <ProductCarousel products={products} />
        </div>
        <ScrollReveal delay={0.2}>
          <div className="text-center mt-12">
            <Link href="/products" className="btn border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50">
              Lihat Semua Koleksi
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <section className="bg-gray-50 rounded-lg p-8 md:p-12">
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Kenapa Ztyle Pilihan Tepat?</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <ScrollReveal delay={0.1}>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="flex items-center justify-center mx-auto mb-4 w-16 h-16 bg-blue-100 text-blue-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.455L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.455l.398-1.178.398 1.178a3.375 3.375 0 002.455 2.455l1.178.398-1.178.398a3.375 3.375 0 00-2.455 2.455z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Koleksi Terkurasi</h3>
              <p className="text-gray-600">Setiap produk dipilih dengan cermat untuk memastikan Anda mendapatkan gaya yang unik, modern, dan berkualitas.</p>
            </div>
          </ScrollReveal>
          
          <ScrollReveal delay={0.2}>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="flex items-center justify-center mx-auto mb-4 w-16 h-16 bg-green-100 text-green-600 rounded-full">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Kualitas Tanpa Kompromi</h3>
              <p className="text-gray-600">Dari bahan terbaik hingga jahitan presisi, kami menjamin setiap produk yang Anda terima adalah yang terbaik.</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="text-center p-6 bg-white rounded-lg border border-gray-200 hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full">
              <div className="flex items-center justify-center mx-auto mb-4 w-16 h-16 bg-purple-100 text-purple-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 013.375-3.375H9.75" /></svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Pengiriman Cepat & Terpercaya</h3>
              <p className="text-gray-600">Pesanan Anda diproses super cepat, dikemas aman, dan dikirim hingga sampai ke tangan Anda.</p>
            </div>
          </ScrollReveal>

        </div>
      </section>

      <section>
        <ScrollReveal>
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-800">Wawasan Fashion Terkini</h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((newsItem: News, idx: number) => (
             <ScrollReveal key={newsItem.id} delay={idx * 0.1}>
               <Link href={`/news/${newsItem.slug}`} className="group block h-full">
                <div className="product-card h-full">
                  <div className="relative h-56 w-full overflow-hidden">
                    <Image
                      src={newsItem.imageUrl}
                      alt={newsItem.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5 flex flex-col justify-between h-[calc(100%-14rem)]">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{newsItem.title}</h3>
                      <p className="text-sm text-gray-600 flex-grow">{newsItem.excerpt}</p>
                    </div>
                     <span className="text-sm font-semibold text-blue-600 mt-4 self-start group-hover:underline">
                      Baca Selengkapnya →
                    </span>
                  </div>
                </div>
              </Link>
             </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={0.2}>
          <div className="text-center mt-12">
            <Link href="/news" className="btn">
              Lihat Semua Berita
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}