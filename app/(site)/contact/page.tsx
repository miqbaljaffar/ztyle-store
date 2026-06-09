'use client'
import { useState } from 'react'

// Impor ikon dari library populer
import { FaWhatsapp } from 'react-icons/fa';
import { EnvelopeIcon, PhoneIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';


export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Di aplikasi nyata, Anda akan mengirim data ini ke API
    alert('Terima kasih atas pesan Anda! Kami akan segera menghubungi Anda kembali.')
    setFormData({ name: '', email: '', message: '' })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const whatsappNumber = "6281388670054";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Halo%20Ztyle,%20saya%20tertarik%20dengan%20produk%20Anda.`;


  return (
    <div className="space-y-12">
        {/* Judul Halaman */}
        <div className="text-center">
            <h1 className="text-4xl font-bold">Hubungi Kami</h1>
            <p className="mt-2 text-lg text-gray-600">
            Punya pertanyaan atau ingin berdiskusi? Kami akan sangat senang mendengar dari Anda.
            </p>
        </div>
      
        {/* Layout Utama (Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

            {/* Kolom Kiri: Form Kontak */}
            <div className="card p-8">
                <h2 className="text-2xl font-semibold mb-6">Kirim Pesan</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="input-field w-full"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="input-field w-full"
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
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
                            className="input-field w-full"
                        />
                    </div>
                    
                    <button type="submit" className="btn w-full py-3">
                        Kirim Pesan
                    </button>
                </form>
            </div>
            
            {/* Kolom Kanan: Informasi Kontak */}
            <div className="card p-8 bg-gray-50">
                <h2 className="text-2xl font-semibold mb-6">Informasi Kontak</h2>
                <div className="space-y-6">
                    <div className="flex items-start gap-4">
                        <FaWhatsapp size={24} className="text-green-500 mt-1" />
                        <div>
                            <h3 className="font-semibold">WhatsApp</h3>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">+62 813-8867-0054</a>
                        </div>
                    </div>

                    <div className="flex items-start gap-4">
                        <EnvelopeIcon className="w-6 h-6 text-gray-500 mt-1" />
                        <div>
                            <h3 className="font-semibold">Email</h3>
                            <p className="text-gray-700">kontak@ztyle.com</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                        <PhoneIcon className="w-6 h-6 text-gray-500 mt-1" />
                        <div>
                            <h3 className="font-semibold">Telepon</h3>
                            <p className="text-gray-700">+62 123 456 7890</p>
                        </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                        <MapPinIcon className="w-6 h-6 text-gray-500 mt-1" />
                        <div>
                            <h3 className="font-semibold">Alamat</h3>
                            <p className="text-gray-700">
                                Jalan Raya No. 123<br />
                                Bandung, Jawa Barat 40123<br />
                                Indonesia
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 border-t pt-6 mt-6">
                        <ClockIcon className="w-6 h-6 text-gray-500 mt-1" />
                        <div>
                            <h3 className="font-semibold">Jam Operasional</h3>
                            <p className="text-gray-700">Senin - Jumat: 09:00 - 18:00 WIB</p>
                            <p className="text-gray-700">Sabtu: 09:00 - 14:00 WIB</p>
                            <p className="text-gray-500">Minggu: Libur</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  )
}