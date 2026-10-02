import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCarousel from '../ui/ProductCarousel';
import ScrollReveal from '../ui/animations/ScrollReveal';

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

const HomeSkeleton = () => (
  <div className="space-y-20">
    <div className="relative h-[400px] animate-pulse rounded-lg bg-gray-200" aria-hidden="true" />
    <div className="h-[400px] animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
    <div className="h-[500px] animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
    <div className="h-[500px] animate-pulse rounded-lg bg-gray-100" aria-hidden="true" />
  </div>
);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async () => {
      try {
        const [productsRes, newsRes] = await Promise.all([
          fetch('/api/products?limit=9', { signal, priority: 'high' }),
          fetch('/api/news?limit=3', { signal, priority: 'low' }),
        ]);

        if (productsRes.ok && !signal.aborted) {
          const productsData = await productsRes.json();
          setProducts(productsData.products ?? []);
        }
        if (newsRes.ok && !signal.aborted) {
          const newsData = await newsRes.json();
          setNews(newsData.news ?? []);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Failed to fetch home page data:', error);
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();
    return () => controller.abort();
  }, []);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="flex flex-col gap-20">
      <ScrollReveal direction="none" duration={0.8}>
        <section
          aria-labelledby="hero-heading"
          className="relative isolate overflow-hidden rounded-lg text-center"
        >
          <img
            src="/back.jpg"
            alt=""
            width={1920}
            height={800}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            aria-hidden="true"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/40 to-black/20" aria-hidden="true" />
          <div className="px-4 py-24 md:py-32">
            <h1
              id="hero-heading"
              className="mb-4 text-4xl font-extrabold text-white shadow-sm md:text-5xl"
            >
              Your Style, Your Story, Your Ztyle.
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-lg text-gray-200">
              Temukan koleksi fashion terkurasi yang mewakili dirimu. Dibuat dengan bahan
              premium dan desain yang tak lekang oleh waktu.
            </p>
            <Link
              to="/products"
              className="btn inline-flex transform items-center justify-center bg-white text-gray-900 shadow-md transition-transform duration-300 hover:scale-105 hover:bg-gray-100"
            >
              Jelajahi Koleksi Terbaru
            </Link>
          </div>
        </section>
      </ScrollReveal>

      <section aria-labelledby="featured-heading">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 id="featured-heading" className="text-3xl font-bold text-gray-800">
              Produk Unggulan Pilihan Kami
            </h2>
            <p className="mt-2 text-gray-500">Setiap item dipilih untuk melengkapi gayamu.</p>
          </div>
        </ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
          <ProductCarousel products={products} />
        </div>
        <ScrollReveal delay={0.2}>
          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="btn border-2 border-blue-600 bg-transparent text-blue-600 hover:bg-blue-50"
            >
              Lihat Semua Koleksi
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <section aria-labelledby="why-heading" className="rounded-lg bg-gray-50 p-8 md:p-12">
        <ScrollReveal>
          <h2
            id="why-heading"
            className="mb-12 text-center text-3xl font-bold text-gray-800"
          >
            Kenapa Ztyle Pilihan Tepat?
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <ScrollReveal delay={0.1}>
            <article className="h-full rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.455L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.455l.398-1.178.398 1.178a3.375 3.375 0 002.455 2.455l1.178.398-1.178.398a3.375 3.375 0 00-2.455 2.455z" /></svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Koleksi Terkurasi</h3>
              <p className="text-gray-600">
                Setiap produk dipilih dengan cermat untuk memastikan Anda mendapatkan gaya
                yang unik, modern, dan berkualitas.
              </p>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <article className="h-full rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Kualitas Tanpa Kompromi</h3>
              <p className="text-gray-600">
                Dari bahan terbaik hingga jahitan presisi, kami menjamin setiap produk yang
                Anda terima adalah yang terbaik.
              </p>
            </article>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <article className="h-full rounded-lg border border-gray-200 bg-white p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125V14.25m-17.25 4.5v-1.875a3.375 3.375 0 013.375-3.375h1.5a1.125 1.125 0 011.125 1.125v-1.5a3.375 3.375 0 013.375-3.375H9.75" /></svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">Pengiriman Cepat &amp; Terpercaya</h3>
              <p className="text-gray-600">
                Pesanan Anda diproses super cepat, dikemas aman, dan dikirim hingga sampai ke
                tangan Anda.
              </p>
            </article>
          </ScrollReveal>
        </div>
      </section>

      <section aria-labelledby="news-heading">
        <ScrollReveal>
          <h2 id="news-heading" className="mb-10 text-center text-3xl font-bold text-gray-800">
            Wawasan Fashion Terkini
          </h2>
        </ScrollReveal>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {news.map((newsItem, idx) => (
            <ScrollReveal key={newsItem.id} delay={idx * 0.1}>
              <Link to={`/news/${newsItem.slug}`} className="group flex h-full flex-col">
                <article className="product-card flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                    <img
                      src={newsItem.imageUrl}
                      alt={newsItem.title}
                      width={600}
                      height={400}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="flex flex-grow flex-col justify-between p-5">
                    <div>
                      <h3 className="mb-2 text-lg font-semibold text-gray-800 transition-colors group-hover:text-blue-600">
                        {newsItem.title}
                      </h3>
                      <p className="text-sm text-gray-600">{newsItem.excerpt}</p>
                    </div>
                    <span className="mt-4 inline-block self-start text-sm font-semibold text-blue-600 group-hover:underline">
                      Baca Selengkapnya →
                    </span>
                  </div>
                </article>
              </Link>
            </ScrollReveal>
          ))}
        </div>
        <ScrollReveal delay={0.2}>
          <div className="mt-12 text-center">
            <Link to="/news" className="btn">Lihat Semua Berita</Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
