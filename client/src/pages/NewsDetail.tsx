import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ClockIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

function SocialShare({ title, url }: { title: string; url: string }) {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm font-semibold text-gray-500">Bagikan:</p>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-blue-800 transition-colors"
      >
        <FaFacebook size={20} />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-blue-500 transition-colors"
      >
        <FaTwitter size={20} />
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 hover:text-green-500 transition-colors"
      >
        <FaWhatsapp size={20} />
      </a>
    </div>
  );
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullUrl = window.location.href;

  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/news/slug/${slug}`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Berita tidak ditemukan.' : 'Gagal mengambil detail berita.');
        }
        const data = await res.json();
        setNewsItem(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    };
    fetchNewsDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !newsItem) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error || 'Berita tidak ditemukan'}</h2>
        <Link to="/news" className="btn btn-primary">
          Kembali ke Semua Berita
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-bold"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Kembali ke Semua Berita
        </Link>
      </div>

      <main className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 md:p-10">
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 mb-6 leading-tight">
          {newsItem.title}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Metadata & Author column */}
          <aside className="md:col-span-1 border-r border-gray-100 pr-4 space-y-5">
            <div className="sticky top-24 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Penulis</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{newsItem.author}</span>
                </div>
              </div>
              
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Tanggal</p>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ClockIcon className="w-4 h-4 text-gray-400" />
                  <span>
                    {new Date(newsItem.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <SocialShare title={newsItem.title} url={fullUrl} />
              </div>
            </div>
          </aside>

          {/* Article contents column */}
          <article className="md:col-span-3 space-y-6">
            <div className="relative w-full rounded-xl overflow-hidden shadow-sm bg-gray-50 border border-gray-100 mb-6">
              <img
                src={newsItem.imageUrl}
                alt={newsItem.title}
                className="w-full h-auto object-cover max-h-[450px]"
              />
            </div>

            <div
              className="prose prose-blue max-w-none text-gray-700 leading-relaxed text-sm md:text-base space-y-4"
              dangerouslySetInnerHTML={{ __html: newsItem.content || '' }}
            />
          </article>
        </div>
      </main>
    </div>
  );
}
