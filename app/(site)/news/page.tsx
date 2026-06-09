import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { unstable_cache } from 'next/cache';
export const dynamic = "force-dynamic";

// Definisikan tipe data untuk kejelasan
interface News {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  slug: string;
}

// Fungsi untuk mengambil semua berita dari database
const getAllNews = unstable_cache(
  async () => {
    const news = await prisma.news.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return news;
  },
  ['all_news'], // Kunci cache unik
  { revalidate: 3600 } // Revalidasi setiap 1 jam
);

export default async function NewsListPage() {
  const allNews = await getAllNews();

  return (
    <div className="space-y-12">
      <div className="card text-center">
        <h1 className="text-4xl font-bold">Berita & Wawasan Fashion</h1>
        <p className="text-lg text-gray-600 mt-2">
          Ikuti tren terbaru, dapatkan tips gaya, dan baca cerita inspiratif dari dunia fashion.
        </p>
      </div>

      {/* Grid untuk daftar berita */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allNews.map((newsItem: News) => (
          <Link key={newsItem.id} href={`/news/${newsItem.slug}`} className="group block">
            <div className="product-card h-full">
              <div className="relative h-56 w-full overflow-hidden">
                <Image
                  src={newsItem.imageUrl}
                  alt={newsItem.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-2 transition-colors group-hover:text-blue-600">
                  {newsItem.title}
                </h2>
                <p className="text-gray-600 flex-grow">{newsItem.excerpt}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}