import prisma from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { Metadata, ResolvingMetadata } from 'next';
import { ClockIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { FaFacebook, FaTwitter, FaWhatsapp } from 'react-icons/fa';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const newsItem = await getNews(slug);

  if (!newsItem) {
    return {
      title: 'Berita Tidak Ditemukan',
      description: 'Halaman berita yang Anda cari tidak dapat ditemukan.',
    }
  }

  const title = `${newsItem.title} | Ztyle News`;
  const description = newsItem.excerpt;

  return {
    title,
    description,
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: newsItem.imageUrl,
          width: 1200,
          height: 630,
          alt: `Gambar untuk ${newsItem.title}`,
        },
      ],
    },
    metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  }
}

const getNews = unstable_cache(
  async (slug: string) => {
    const newsItem = await prisma.news.findUnique({
      where: { slug },
    });

    if (!newsItem) {
      notFound();
    }
    return newsItem;
  },
  ['news_by_slug'],
  { revalidate: 3600 }
);

// Komponen untuk Tombol Berbagi Sosial
function SocialShare({ title, url }: { title: string, url: string }) {
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(url);

    return (
        <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-gray-600">Bagikan:</p>
            <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-800 transition-colors">
                <FaFacebook size={22} />
            </a>
            <a href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-500 transition-colors">
                <FaTwitter size={22} />
            </a>
            <a href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-green-500 transition-colors">
                <FaWhatsapp size={22} />
            </a>
        </div>
    )
}


export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const newsItem = await getNews(slug);
  const siteUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const fullUrl = `${siteUrl}/news/${slug}`;


  const newsArticleSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": newsItem.title,
    "image": [`${siteUrl}${newsItem.imageUrl}`],
    "datePublished": new Date(newsItem.createdAt).toISOString(),
    "dateModified": new Date(newsItem.updatedAt).toISOString(),
    "author": [{
        "@type": "Person",
        "name": newsItem.author,
        "url": `${siteUrl}/about`
    }],
    "publisher": {
      "@type": "Organization",
      "name": "Ztyle",
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/Logo.png`
      }
    },
    "description": newsItem.excerpt
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": `${siteUrl}`},
      { "@type": "ListItem", "position": 2, "name": "News", "item": `${siteUrl}/news`},
      { "@type": "ListItem", "position": 3, "name": newsItem.title, "item": fullUrl}
    ]
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(newsArticleSchema) }}/>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}/>
      
      <div className="mb-8">
        <Link href="/news" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-semibold">
          <ArrowLeftIcon className="w-5 h-5" />
          Kembali ke Semua Berita
        </Link>
      </div>
      
      <main className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{newsItem.title}</h1>
            
            <div className="md:grid md:grid-cols-4 md:gap-8">
              {/* Kolom Info Penulis (di samping untuk desktop) */}
              <aside className="md:col-span-1 mb-8 md:mb-0">
                  <div className="sticky top-24 space-y-4">
                      {/* --- PERBAIKAN PADA WADAH GAMBAR --- */}
                      <div className="relative w-full h-auto overflow-hidden rounded-lg shadow-md mb-6">
                          <Image
                            src={newsItem.imageUrl}
                            alt={`Gambar untuk ${newsItem.title}`}
                            width={400} // Berikan nilai width dan height
                            height={600} // Nilai ini akan menjaga rasio aspek
                            className="w-full h-auto object-contain" // object-contain & penyesuaian kelas
                            priority
                          />
                      </div>
                      <div>
                          <p className="text-sm font-semibold text-gray-500 mb-1">Penulis</p>
                          <div className="flex items-center gap-2">
                              <UserIcon className="w-5 h-5 text-gray-400"/>
                              <span className="font-medium text-gray-800">{newsItem.author}</span>
                          </div>
                      </div>
                       <div>
                          <p className="text-sm font-semibold text-gray-500 mb-1">Tanggal</p>
                          <div className="flex items-center gap-2">
                              <ClockIcon className="w-5 h-5 text-gray-400"/>
                              {/* --- BARIS INI YANG DIPERBAIKI --- */}
                              <span className="text-sm text-gray-600">{new Date(newsItem.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                      </div>
                      <div className="pt-4">
                        <SocialShare title={newsItem.title} url={fullUrl} />
                      </div>
                  </div>
              </aside>

              {/* Konten Artikel */}
              <article className="md:col-span-3">
                  <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: newsItem.content || '' }}
                  />
              </article>
            </div>
        </div>
      </main>
    </div>
  );
}