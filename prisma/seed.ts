import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

// Inisialisasi Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log(`Memulai proses seeding...`);

  // --- 1. Seeding Kategori ---
  const initialCategories = [
    { name: 'Kemeja' },
    { name: 'Celana' },
    { name: 'Rok' },
    { name: 'Kaos' },
    { name: 'Pakaian Unisex' },
    { name: 'Pakaian Pria' },
    { name: 'Pakaian Wanita' },
  ];

  for (const categoryData of initialCategories) {
    await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {},
      create: { name: categoryData.name },
    });
    console.log(`Kategori "${categoryData.name}" berhasil dibuat atau sudah ada.`);
  }

  // --- 2. Seeding Pengguna (Admin dan Customer) ---
  console.log(`Membuat pengguna admin dan customer...`);

  // Data untuk Admin (UPDATED)
  const adminPassword = await hash('Ztyle#0811', 10); // Password baru
  await prisma.user.upsert({
    where: { email: 'admin@example.com' }, // Email lama sebagai kunci pencarian
    update: {
      email: 'AdminZtyle1108@ztyle.com', // Email baru
      password: adminPassword, // Password baru yang sudah di-hash
      role: 'ADMIN',
      emailVerified: new Date(),
    },
    create: {
      email: 'AdminZtyle1108@ztyle.com', // Email baru
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
});
  console.log(`Pengguna Admin (AdminZtyle1108@ztyle.com) berhasil diperbarui.`);

  // Data untuk Customer (TIDAK BERUBAH)
  const customerPassword = await hash('customer123', 10);
  await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'Customer User',
      password: customerPassword,
      role: 'CUSTOMER',
    },
  });
  console.log(`Pengguna Customer (customer@example.com) berhasil dibuat.`);

  // --- 3. Seeding Berita (News) ---
  console.log('Membuat data berita...');
  const newsData = [
    {
      title: '5 Tren Fashion Pria yang Akan Mendominasi di Tahun 2025',
      excerpt: 'Dari siluet longgar hingga warna-warna berani, inilah tampilan kunci yang perlu Anda ketahui.',
      content: 'Tahun 2025 menandai pergeseran signifikan dalam fashion pria. Desainer di seluruh dunia meninggalkan potongan yang sangat ketat dan merangkul kenyamanan dengan siluet yang lebih longgar dan mengalir. Celana berpotongan lebar, kemeja kebesaran, dan outerwear yang santai menjadi pusat perhatian. Selain itu, palet warna netral mulai digantikan oleh warna-warna yang lebih cerah dan berani seperti oranye terbakar, biru kobalt, dan hijau limau, memberikan pernyataan yang kuat namun tetap elegan.',
      imageUrl: '/news1.jpg',
      slug: 'tren-fashion-pria-2025',
      author: 'Andi Pratama'
    },
    {
      title: 'Kiat Padu Padan Aksesoris untuk Tampil Beda',
      excerpt: 'Ubah pakaian sederhana menjadi luar biasa dengan pilihan aksesoris yang tepat.',
      content: 'Aksesoris adalah kunci untuk personalisasi gaya. Jangan takut untuk bereksperimen. Kalung bertumpuk, gelang kulit, atau bahkan tas selempang yang unik dapat langsung meningkatkan penampilan Anda. Untuk tampilan kasual, coba padukan kaos putih polos dengan beberapa kalung perak. Untuk acara yang lebih formal, jam tangan klasik dan dasi dengan pola menarik akan menunjukkan perhatian Anda terhadap detail.',
      imageUrl: '/news2.jpg',
      slug: 'kiat-padu-padan-aksesoris',
      author: 'Rina Wijaya'
    },
    {
      title: 'Mengenal Bahan Berkelanjutan dalam Dunia Fashion',
      excerpt: 'Ketahui lebih dalam tentang katun organik, linen, dan Tencel yang ramah lingkungan.',
      content: 'Seiring meningkatnya kesadaran akan lingkungan, industri fashion pun bergerak ke arah yang lebih hijau. Bahan-bahan seperti katun organik, yang ditanam tanpa pestisida berbahaya, dan linen, yang membutuhkan lebih sedikit air, menjadi semakin populer. Selain itu, inovasi seperti Tencel™, yang terbuat dari pulp kayu dari hutan yang dikelola secara lestari, menawarkan alternatif yang lembut, sejuk, dan dapat terurai secara hayati. Memilih pakaian dari bahan-bahan ini adalah langkah kecil yang berdampak besar bagi planet kita.',
      imageUrl: '/news3.jpg',
      slug: 'mengenal-bahan-berkelanjutan',
      author: 'Siti Amelia'
    },
  ];

  for (const news of newsData) {
    await prisma.news.upsert({
      where: { slug: news.slug },
      update: news,
      create: news,
    });
    console.log(`Berita "${news.title}" berhasil dibuat atau diperbarui.`);
  }

  console.log(`Proses seeding selesai.`);
}

// Jalankan fungsi main dan tangani jika ada error
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // Tutup koneksi Prisma
    await prisma.$disconnect();
  });