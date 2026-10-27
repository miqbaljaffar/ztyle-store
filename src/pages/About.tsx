import { Link } from 'react-router-dom';
import { SparklesIcon, BuildingStorefrontIcon, UsersIcon } from '@heroicons/react/24/outline';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-16">
      
      {/* 1. Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">Your Style, Your Story.</h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Ztyle bukan sekadar platform fashion. Kami adalah sebuah gerakan untuk merayakan keunikan, 
          menemukan jati diri lewat penampilan, dan memberdayakan kreator lokal di seluruh Indonesia.
        </p>
      </section>

      {/* 2. Our Story Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-80 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
            <img 
              src="/proses.jpg"
              alt="Proses kreatif UMKM"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Bagaimana Ztyle Bermula?</h2>
            <div className="text-gray-600 leading-relaxed space-y-4 text-sm md:text-base">
              <p>
                Semuanya berawal dari sebuah pengamatan sederhana: Indonesia penuh dengan talenta fashion yang luar biasa, 
                namun seringkali tersembunyi. UMKM dengan produk otentik kesulitan menjangkau pasar yang lebih luas.
              </p>
              <p>
                Di sisi lain, kami melihat generasi kami—Gen Z—haus akan gaya yang unik dan bercerita, 
                bukan sekadar logo merek besar. Kami ingin penampilan kami menjadi cerminan dari siapa kami sebenarnya. 
                Ztyle lahir untuk menjembatani keduanya.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 3. Our Mission/Values Section */}
      <section className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">DNA Kami</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
            <BuildingStorefrontIcon className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Memberdayakan UMKM</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Kami memberikan panggung digital bagi para pahlawan fashion lokal. Setiap pembelian Anda adalah dukungan langsung bagi mimpi dan kreativitas mereka.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
            <SparklesIcon className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Kurasi Penuh Gaya</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Lupakan scroll tanpa akhir. Tim kami memilih produk-produk yang tidak hanya tren, tapi juga berkualitas dan memiliki karakter. Your next favorite outfit is here.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
            <UsersIcon className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Komunitas & Ekspresi</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Bagi kami, fashion adalah dialog. Ztyle adalah ruang aman untuk bereksperimen, menemukan gaya, dan terhubung dengan sesama pecinta fashion.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Call to Action (CTA) Section */}
      <section className="bg-gray-950 text-white rounded-2xl p-8 md:p-12 text-center shadow-lg">
        <h2 className="text-2xl md:text-4xl font-extrabold mb-4">Join The Movement.</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8 text-sm md:text-base leading-relaxed">
          Siap untuk mengubah penampilan atau ingin membawa brand lokalmu ke level selanjutnya? 
          Ztyle adalah tempatnya.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/products" className="py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all text-sm">
            Jelajahi Koleksi
          </Link>
          <Link to="/contact" className="py-3 px-6 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold transition-all text-sm border border-gray-200">
            Jadi Partner Kami
          </Link>
        </div>
      </section>
      
    </div>
  );
}
