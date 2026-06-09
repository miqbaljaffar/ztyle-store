import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface News {
  id: number;
  title: string;
  excerpt: string;
  imageUrl: string;
  slug: string;
  createdAt: string;
}

export default function News() {
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/news');
        if (!res.ok) {
          throw new Error('Gagal mengambil data berita.');
        }
        const data = await res.json();
        setNewsList(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Berita & Wawasan Fashion</h1>
        <p className="text-gray-600 mt-3 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Ikuti tren terbaru, dapatkan tips gaya, dan baca cerita inspiratif dari dunia fashion.
        </p>
      </div>

      {newsList.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Belum ada berita saat ini.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {newsList.map((newsItem) => (
            <Link key={newsItem.id} to={`/news/${newsItem.slug}`} className="group block">
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md h-full flex flex-col">
                <div className="relative h-56 w-full overflow-hidden bg-gray-50">
                  <img
                    src={newsItem.imageUrl}
                    alt={newsItem.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <span className="text-xs text-gray-400 font-medium mb-2 inline-block">
                    {new Date(newsItem.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 leading-snug transition-colors group-hover:text-blue-600">
                    {newsItem.title}
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed flex-grow">{newsItem.excerpt}</p>
                  <span className="text-blue-600 text-xs font-bold mt-4 inline-flex items-center gap-1 group-hover:underline">
                    Baca Selengkapnya →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
