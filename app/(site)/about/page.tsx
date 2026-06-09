import Image from 'next/image'
import Link from 'next/link'
import { SparklesIcon, BuildingStorefrontIcon, UsersIcon } from '@heroicons/react/24/outline'

export default function AboutPage() {
  return (
    <div className="space-y-16">
      
      {/* 1. Hero Section: Pernyataan yang Bold */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Your Style, Your Story.</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Ztyle bukan sekadar platform fashion. Kami adalah sebuah gerakan untuk merayakan keunikan, 
          menemukan jati diri lewat penampilan, dan memberdayakan kreator lokal di seluruh Indonesia.
        </p>
      </section>

      {/* 2. Our Story Section: Visual & Naratif */}
      <section className="card">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-80 rounded-lg overflow-hidden">
             {/* Ganti dengan gambar yang merepresentasikan UMKM atau proses kreatif */}
            <Image 
              src="/proses.jpg"
              alt="Proses kreatif UMKM"
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Bagaimana Ztyle Bermula?</h2>
            <p className="text-gray-700 leading-relaxed space-y-4">
              <span>
                Semuanya berawal dari sebuah pengamatan sederhana: Indonesia penuh dengan talenta fashion yang luar biasa, 
                namun seringkali tersembunyi. UMKM dengan produk otentik kesulitan menjangkau pasar yang lebih luas.
              </span>
              <span>
                Di sisi lain, kami melihat generasi kami—Gen Z—haus akan gaya yang unik dan bercerita, 
                bukan sekadar logo merek besar. Kami ingin penampilan kami menjadi cerminan dari siapa kami sebenarnya. 
                Ztyle lahir untuk menjembatani keduanya.
              </span>
            </p>
          </div>
        </div>
      </section>
      
      {/* 3. Our Mission/Values Section: Dibuat lebih menarik dengan ikon */}
      <section className="text-center">
        <h2 className="text-3xl font-bold mb-8">DNA Kami</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="card text-left">
            <BuildingStorefrontIcon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Memberdayakan UMKM</h3>
            <p className="text-gray-600">
              Kami memberikan panggung digital bagi para pahlawan fashion lokal. Setiap pembelian Anda adalah dukungan langsung bagi mimpi dan kreativitas mereka.
            </p>
          </div>
          <div className="card text-left">
            <SparklesIcon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kurasi Penuh Gaya</h3>
            <p className="text-gray-600">
              Lupakan scroll tanpa akhir. Tim kami memilih produk-produk yang tidak hanya tren, tapi juga berkualitas dan memiliki karakter. Your next favorite outfit is here.
            </p>
          </div>
          <div className="card text-left">
            <UsersIcon className="w-12 h-12 text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Komunitas & Ekspresi</h3>
            <p className="text-gray-600">
              Bagi kami, fashion adalah dialog. Ztyle adalah ruang aman untuk bereksperimen, menemukan gaya, dan terhubung dengan sesama pecinta fashion.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Call to Action (CTA) Section */}
      <section style={{
        background: '#111827',
        color: '#fff',
        borderRadius: '12px',
        padding: '50px 30px',
        textAlign: 'center'
      }}>
        <h2 className="text-3xl font-bold mb-4">Join The Movement.</h2>
        <p className="text-gray-300 max-w-2xl mx-auto mb-8">
          Siap untuk mengubah penampilan atau ingin membawa brand lokalmu ke level selanjutnya? 
          Ztyle adalah tempatnya.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/products" className="btn">
            Jelajahi Koleksi
          </Link>
          <Link href="/contact" className="btn" style={{ background: '#fff', color: '#111827' }}>
            Jadi Partner Kami
          </Link>
        </div>
      </section>
      
    </div>
  )
}