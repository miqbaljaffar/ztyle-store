import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Terima kasih atas pesan Anda! Kami akan segera menghubungi Anda kembali.');
    setFormData({ name: '', email: '', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const whatsappNumber = '6281388670054';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Halo%20Ztyle,%20saya%20tertarik%20dengan%20produk%20Anda.`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">Hubungi Kami</h1>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          Punya pertanyaan atau ingin berdiskusi? Kami akan sangat senang mendengar dari Anda.
        </p>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        {/* Left Column: Contact Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Kirim Pesan</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Nama Lengkap Anda"
                className="block w-full rounded-md border border-gray-200 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Alamat email aktif"
                className="block w-full rounded-md border border-gray-200 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Pesan Anda
              </label>
              <textarea
                name="message"
                id="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Tuliskan pertanyaan atau pesan Anda di sini..."
                className="block w-full rounded-md border border-gray-200 py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-400 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100 text-sm"
            >
              Kirim Pesan
            </button>
          </form>
        </div>

        {/* Right Column: Contact Information */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informasi Kontak</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-green-100 p-2.5 rounded-xl border border-green-200">
                <FaWhatsapp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">WhatsApp</h3>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-semibold mt-1 inline-block"
                >
                  +62 813-8867-0054
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                <EnvelopeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Email</h3>
                <p className="text-gray-600 text-sm mt-1 font-medium">kontak@ztyle.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2.5 rounded-xl border border-gray-200">
                <PhoneIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Telepon</h3>
                <p className="text-gray-600 text-sm mt-1 font-medium">+62 123 456 7890</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-gray-100 p-2.5 rounded-xl border border-gray-200">
                <MapPinIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Alamat</h3>
                <p className="text-gray-600 text-sm mt-1 leading-relaxed font-medium">
                  Jalan Raya No. 123
                  <br />
                  Bandung, Jawa Barat 40123
                  <br />
                  Indonesia
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-100 pt-6 mt-6">
              <div className="bg-gray-100 p-2.5 rounded-xl border border-gray-200">
                <ClockIcon className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Jam Operasional</h3>
                <p className="text-gray-600 text-sm mt-1 font-medium">Senin - Jumat: 09:00 - 18:00 WIB</p>
                <p className="text-gray-600 text-sm font-medium">Sabtu: 09:00 - 14:00 WIB</p>
                <p className="text-gray-400 text-xs mt-1 font-bold">Minggu: Libur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
